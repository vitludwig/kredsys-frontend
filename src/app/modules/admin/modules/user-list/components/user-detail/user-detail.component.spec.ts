import {ComponentFixture, TestBed} from '@angular/core/testing';
import {UserDetailComponent} from './user-detail.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../../../common/decorators/cache';

describe('UserDetailComponent', () => {
	let component: UserDetailComponent;
	let fixture: ComponentFixture<UserDetailComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, MatSnackBarModule, MatDialogModule],
			declarations: [UserDetailComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {snapshot: {paramMap: {get: () => '1'}}, params: of({})},
				},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(UserDetailComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
