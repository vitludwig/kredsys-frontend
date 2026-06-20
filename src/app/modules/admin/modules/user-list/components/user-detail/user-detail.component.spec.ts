import {ComponentFixture, TestBed} from '@angular/core/testing';
import {UserDetailComponent} from './user-detail.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../../../common/decorators/cache';
import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {AlertService} from '../../../../../../common/services/alert/alert.service';
import {EUserRole, IUser} from '../../../../../../common/types/IUser';

describe('UserDetailComponent', () => {
	let component: UserDetailComponent;
	let fixture: ComponentFixture<UserDetailComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			declarations: [UserDetailComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule, MatDialogModule],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: { snapshot: { paramMap: { get: () => '1' } }, params: of({}) },
				},
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

describe('UserDetailComponent — add-user notifications', () => {
	let component: UserDetailComponent;
	let fixture: ComponentFixture<UserDetailComponent>;
	let alertService: AlertService;

	const createdUser: IUser = { id: 5, name: 'Test', email: 't@t.cz', memberId: 123, roles: [], blocked: false };

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			declarations: [UserDetailComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule, MatDialogModule],
			providers: [
				{
					provide: ActivatedRoute,
					// id = null -> add mode (no detail requests fired)
					useValue: { snapshot: { paramMap: { get: () => null }, queryParamMap: { get: () => null } }, params: of({}) },
				},
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();

		fixture = TestBed.createComponent(UserDetailComponent);
		component = fixture.componentInstance;
		// Don't render the template (the form needs Material modules); onSubmit is tested directly.
		component.isEdit = false;

		alertService = TestBed.inject(AlertService);
		spyOn(alertService, 'success');
		spyOn(alertService, 'error');
		spyOn(TestBed.inject(Router), 'navigate');

		// make the form valid so onSubmit proceeds past the guard
		(component as any).userFormGroup.setValue({
			memberId: 123, name: 'Test', email: 't@t.cz', password: 'x', passwordAgain: 'x', role: EUserRole.MEMBER, groupId: null,
		});
	});

	it('shows a success notification when the user is added (200)', async () => {
		spyOn(component as any, 'addUser').and.resolveTo(createdUser);
		await (component as any).onSubmit();
		expect(alertService.success).toHaveBeenCalledWith('Uživatel přidán');
		expect(alertService.error).not.toHaveBeenCalled();
	});

	it('shows a conflict notification on 409', async () => {
		spyOn(component as any, 'addUser').and.rejectWith(new HttpErrorResponse({ status: 409 }));
		await (component as any).onSubmit();
		expect(alertService.error).toHaveBeenCalledWith('Uživatel se zadaným členským číslem, e-mailem nebo čipem už existuje');
		expect(alertService.success).not.toHaveBeenCalled();
	});

	it('shows a server-error notification on 500', async () => {
		spyOn(component as any, 'addUser').and.rejectWith(new HttpErrorResponse({ status: 500 }));
		await (component as any).onSubmit();
		expect(alertService.error).toHaveBeenCalledWith('Chyba serveru — uživatele se nepodařilo přidat, zkuste to znovu');
	});
});
