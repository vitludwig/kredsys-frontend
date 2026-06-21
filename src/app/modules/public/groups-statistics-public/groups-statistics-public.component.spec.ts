import {Component, Input} from '@angular/core';
import {ComponentFixture, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {of} from 'rxjs';
import {PublicGroupsStatisticsComponent} from './groups-statistics-public.component';
import {GroupsService} from '../../groups/services/groups.service';
import {IScoreboardGroup} from '../../groups/types/IScoreboardGroup';

@Component({ selector: 'app-groups-scoreboard', template: '', standalone: true })
class GroupsScoreboardStub {
	@Input() groups: IScoreboardGroup[] | null = null;
}

describe('PublicGroupsStatisticsComponent', () => {
	let component: PublicGroupsStatisticsComponent;
	let fixture: ComponentFixture<PublicGroupsStatisticsComponent>;
	let getPublic: jasmine.Spy;

	beforeEach(async () => {
		getPublic = jasmine.createSpy('getPublicGroupStatistics').and.returnValue(of({
			sumPrice: 30,
			groups: [{ id: 1, name: 'A', color: '#ff0000', points: 30 }],
		}));
		await TestBed.configureTestingModule({
			schemas: [NO_ERRORS_SCHEMA],
			imports: [PublicGroupsStatisticsComponent],
			providers: [
				{ provide: GroupsService, useValue: { getPublicGroupStatistics: getPublic } },
			],
		})
		.overrideComponent(PublicGroupsStatisticsComponent, {
			set: { imports: [GroupsScoreboardStub] }
		})
		.compileComponents();
	});

	it('polls the public endpoint and maps points to scoreboard totals', fakeAsync(() => {
		fixture = TestBed.createComponent(PublicGroupsStatisticsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		tick(0);
		expect(getPublic).toHaveBeenCalled();
		expect(component['scoreboard']()).toEqual([{ id: 1, name: 'A', color: '#ff0000', total: 30 }]);
	}));
});
