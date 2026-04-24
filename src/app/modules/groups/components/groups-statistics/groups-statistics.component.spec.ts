import {ComponentFixture, TestBed} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {GroupsStatisticsComponent} from './groups-statistics.component';
import {clearAllCaches} from '../../../../common/decorators/cache';
import {AuthService} from '../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';

describe('GroupsStatisticsComponent', () => {
	let component: GroupsStatisticsComponent;
	let fixture: ComponentFixture<GroupsStatisticsComponent>;

	beforeEach(async () => {
		clearAllCaches();
		await TestBed.configureTestingModule({
			imports: [GroupsStatisticsComponent, HttpClientTestingModule, MatSnackBarModule],
			providers: [
				{provide: AuthService, useValue: {isLogged$: new BehaviorSubject(false), isLogged: false, user: null, isDebug: false}},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(GroupsStatisticsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
