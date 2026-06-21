import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {GroupsScoreboardComponent} from './groups-scoreboard.component';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {AlertService} from '../../../../common/services/alert/alert.service';

function rows(aTotal: number) {
	return [
		{ id: 1, name: 'A', color: '#ff0000', total: aTotal },
		{ id: 2, name: 'B', color: '#00ff00', total: 100 },
	];
}

describe('GroupsScoreboardComponent', () => {
	let component: GroupsScoreboardComponent;
	let fixture: ComponentFixture<GroupsScoreboardComponent>;
	let alertSpy: { error: jasmine.Spy; success: jasmine.Spy; info: jasmine.Spy };

	beforeEach(async () => {
		localStorage.clear();
		alertSpy = {
			error: jasmine.createSpy('error'),
			success: jasmine.createSpy('success'),
			info: jasmine.createSpy('info'),
		};
		await TestBed.configureTestingModule({
			schemas: [NO_ERRORS_SCHEMA],
			imports: [GroupsScoreboardComponent, MatSnackBarModule],
			providers: [{ provide: AlertService, useValue: alertSpy }],
		}).compileComponents();
		fixture = TestBed.createComponent(GroupsScoreboardComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	it('applies the fullscreen host class only when fillViewport is set', () => {
		// default fixture (fillViewport unset) → no fullscreen class
		expect((fixture.nativeElement as HTMLElement).classList.contains('gs-fullscreen')).toBeFalse();

		// fresh instance with the input set before first change detection (as the public page binds it)
		const f2 = TestBed.createComponent(GroupsScoreboardComponent);
		f2.componentInstance.fillViewport = true;
		f2.detectChanges();
		expect((f2.nativeElement as HTMLElement).classList.contains('gs-fullscreen')).toBeTrue();
	});

	it('clears the chart and shows NO error toast when given null (initial render before data)', () => {
		component.groups = rows(50);          // first real data
		component.groups = null;              // e.g. initial binding / later cleared

		expect(component['chartData'].datasets.length).toBe(0);
		expect(alertSpy.error).not.toHaveBeenCalled();
	});

	it('does not celebrate on the first update', () => {
		component.groups = rows(50);
		expect(component['banner']()).toBeNull();
	});

	it('banners the group that gained points between updates', () => {
		component.groups = rows(50);
		component.groups = rows(80);
		expect(component['banner']()).toEqual({ text: 'Skupina A získala body!', color: '#ff0000' });
	});

	it('does not banner when no group gained points', () => {
		component.groups = rows(50);
		component.groups = rows(50);
		expect(component['banner']()).toBeNull();
	});

	it('the toggle gates only the confetti — banner still shows when off', () => {
		const confettiSpy = spyOn(component as any, 'spawnConfetti');
		component['animationsEnabled'].set(false);
		component.groups = rows(50);
		component.groups = rows(80);
		expect(confettiSpy).not.toHaveBeenCalled();
		expect(component['banner']()).toEqual({ text: 'Skupina A získala body!', color: '#ff0000' });
	});

	it('spawns confetti when the toggle is on', () => {
		const confettiSpy = spyOn(component as any, 'spawnConfetti');
		component.groups = rows(50);
		component.groups = rows(80);
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
