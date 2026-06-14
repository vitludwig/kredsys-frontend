import {ComponentFixture, TestBed} from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {GroupsStatisticsComponent} from './groups-statistics.component';
import {clearAllCaches} from '../../../../common/decorators/cache';
import {AuthService} from '../../../login/services/auth/auth.service';
import {BehaviorSubject} from 'rxjs';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

function makeStats(groupATotal: number): any {
	return {
		sumGoods: 0,
		sumPrice: 0,
		groupsStatistics: [
			{ group: { id: 1, name: 'A', color: '#ff0000' }, statistics: { goods: [{ sumPrice: groupATotal }] } },
			{ group: { id: 2, name: 'B', color: '#00ff00' }, statistics: { goods: [{ sumPrice: 100 }] } },
		],
	};
}

describe('GroupsStatisticsComponent', () => {
	let component: GroupsStatisticsComponent;
	let fixture: ComponentFixture<GroupsStatisticsComponent>;

	beforeEach(async () => {
		clearAllCaches();
		localStorage.clear();
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

	it('does not celebrate on the first poll', () => {
		(component as any).updateChartData(makeStats(50));
		expect(component['banner']()).toBeNull();
	});

	it('banners the group that gained points between polls', () => {
		(component as any).updateChartData(makeStats(50));
		(component as any).updateChartData(makeStats(80)); // group A grew 50 → 80
		expect(component['banner']()).toEqual({ text: 'Skupina A získala body!', color: '#ff0000' });
	});

	it('does not banner when no group gained points', () => {
		(component as any).updateChartData(makeStats(50));
		(component as any).updateChartData(makeStats(50)); // unchanged
		expect(component['banner']()).toBeNull();
	});

	it('the toggle gates only the confetti — banner still shows when off', () => {
		const confettiSpy = spyOn(component as any, 'spawnConfetti');
		component['animationsEnabled'].set(false);
		(component as any).updateChartData(makeStats(50));
		(component as any).updateChartData(makeStats(80)); // group A grew
		expect(confettiSpy).not.toHaveBeenCalled();                       // confetti suppressed
		expect(component['banner']()).toEqual({ text: 'Skupina A získala body!', color: '#ff0000' }); // banner still shows
	});

	it('spawns confetti when the toggle is on', () => {
		const confettiSpy = spyOn(component as any, 'spawnConfetti');
		(component as any).updateChartData(makeStats(50));
		(component as any).updateChartData(makeStats(80)); // group A grew
		expect(confettiSpy).toHaveBeenCalled();
	});

	it('toggleAnimations flips and persists the preference', () => {
		expect(component['animationsEnabled']()).toBe(true);
		(component as any).toggleAnimations();
		expect(component['animationsEnabled']()).toBe(false);
		expect(localStorage.getItem('groupsStatistics.animationsEnabled')).toBe('off');
		(component as any).toggleAnimations();
		expect(component['animationsEnabled']()).toBe(true);
		expect(localStorage.getItem('groupsStatistics.animationsEnabled')).toBe('on');
	});
});
