import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {CardInfoComponent} from './card-info.component';
import {clearAllCaches} from '../../common/decorators/cache';
import {AuthService} from '../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('CardInfoComponent', () => {
	let component: CardInfoComponent;
	let fixture: ComponentFixture<CardInfoComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
    declarations: [CardInfoComponent],
    schemas: [NO_ERRORS_SCHEMA],
    imports: [MatSnackBarModule, MatDialogModule],
    providers: [
        { provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false, hasRole: () => false } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
})
		.overrideComponent(CardInfoComponent, {set: {template: ''}})
		.compileComponents();
	});

	beforeEach(() => {
		fixture = TestBed.createComponent(CardInfoComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
