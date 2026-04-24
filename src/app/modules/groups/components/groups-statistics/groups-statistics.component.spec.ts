import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {GroupsStatisticsComponent} from './groups-statistics.component';
import {clearAllCaches} from '../../../../common/decorators/cache';
import {AuthService} from '../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GroupsStatisticsComponent', () => {
	let component: GroupsStatisticsComponent;
	let fixture: ComponentFixture<GroupsStatisticsComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    imports: [GroupsStatisticsComponent, MatSnackBarModule],
    providers: [
        { provide: AuthService, useValue: { isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false } },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
    ]
}).compileComponents();

		fixture = TestBed.createComponent(GroupsStatisticsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
