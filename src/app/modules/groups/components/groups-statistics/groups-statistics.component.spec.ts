import {Component, Input} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {provideHttpClientTesting} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of, throwError} from 'rxjs';
import {GroupsStatisticsComponent} from './groups-statistics.component';
import {GroupsService} from '../../services/groups.service';
import {CurrencyService} from '../../../admin/services/currency/currency.service';
import {AlertService} from '../../../../common/services/alert/alert.service';
import {provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {IScoreboardGroup} from '../../types/IScoreboardGroup';

@Component({ selector: 'app-groups-scoreboard', template: '', standalone: true })
class GroupsScoreboardStub {
	@Input() groups: IScoreboardGroup[] | null = null;
}

describe('GroupsStatisticsComponent (container)', () => {
	let component: GroupsStatisticsComponent;
	let fixture: ComponentFixture<GroupsStatisticsComponent>;
	let getStats: jasmine.Spy;
	let alertSpy: { error: jasmine.Spy; success: jasmine.Spy; info: jasmine.Spy };

	beforeEach(async () => {
		getStats = jasmine.createSpy('getGroupStatistics').and.returnValue(of({
			sumGoods: 0, sumPrice: 0,
			groupsStatistics: [
				{ group: { id: 1, name: 'A', color: '#ff0000' }, statistics: { goods: [{ sumPrice: 30 }] } },
			],
		}));
		alertSpy = {
			error: jasmine.createSpy('error'),
			success: jasmine.createSpy('success'),
			info: jasmine.createSpy('info'),
		};
		await TestBed.configureTestingModule({
			schemas: [NO_ERRORS_SCHEMA],
			imports: [GroupsStatisticsComponent],
			providers: [
				{ provide: CurrencyService, useValue: { getDefaultCurrency$: () => of({ id: 1, name: 'CZK' }) } },
				{ provide: GroupsService, useValue: { getGroupStatistics: getStats } },
				{ provide: AlertService, useValue: alertSpy },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			],
		})
		.overrideComponent(GroupsStatisticsComponent, {
			set: { imports: [GroupsScoreboardStub] }
		})
		.compileComponents();
	});

	it('maps group statistics to scoreboard rows (total = sum of goods sumPrice)', fakeAsync(() => {
		fixture = TestBed.createComponent(GroupsStatisticsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		tick(0);
		expect(component['scoreboard']()).toEqual([{ id: 1, name: 'A', color: '#ff0000', total: 30 }]);
		expect(alertSpy.error).not.toHaveBeenCalled();
	}));

	it('shows an error toast when the statistics fetch fails', fakeAsync(() => {
		spyOn(console, 'error'); // the container logs the failure by design — keep test output pristine
		getStats.and.returnValue(throwError(() => new Error('boom')));
		fixture = TestBed.createComponent(GroupsStatisticsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		tick(0);
		expect(alertSpy.error).toHaveBeenCalledWith('Chyba při načítání statistik');
		expect(component['scoreboard']()).toBeNull();
	}));
});
