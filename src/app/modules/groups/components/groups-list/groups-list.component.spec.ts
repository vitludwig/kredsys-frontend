import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { GroupsListComponent } from './groups-list.component';
import { GroupsService } from '../../services/groups.service';
import { AlertService } from '../../../../common/services/alert/alert.service';
import { IGroup } from '../../types/IGroup';

describe('GroupsListComponent', () => {
	let fixture: ComponentFixture<GroupsListComponent>;
	let groupsService: jasmine.SpyObj<GroupsService>;

	const groups: IGroup[] = [
		{ id: 1, name: 'Alpha', description: '', color: '#ffffff', memberCount: 3 },
		{ id: 2, name: 'Beta', description: '', color: '#000000', memberCount: 0 },
	];

	beforeEach(() => {
		groupsService = jasmine.createSpyObj<GroupsService>('GroupsService', ['getGroups', 'removeGroup']);
		groupsService.getGroups.and.returnValue(of({ data: groups, count: groups.length }));

		TestBed.configureTestingModule({
			imports: [GroupsListComponent],
			providers: [
				provideRouter([]),
				{ provide: GroupsService, useValue: groupsService },
				{ provide: AlertService, useValue: jasmine.createSpyObj('AlertService', ['error', 'success']) },
			],
		});
	});

	it('includes memberCount in displayedColumns', () => {
		fixture = TestBed.createComponent(GroupsListComponent);
		fixture.detectChanges();
		expect((fixture.componentInstance as any).displayedColumns).toContain('memberCount');
	});

	it('renders the member count for each group row', fakeAsync(() => {
		// The list pipeline debounces its initial (startWith) emission by 300ms; the component
		// must be created inside the fakeAsync zone so tick() can flush that timer and load rows.
		fixture = TestBed.createComponent(GroupsListComponent);
		fixture.detectChanges();
		tick(300);
		fixture.detectChanges();
		const el: HTMLElement = fixture.nativeElement;
		expect(el.querySelector('[data-testid="row-group-1"]')?.textContent).toContain('3');
		expect(el.querySelector('[data-testid="row-group-2"]')?.textContent).toContain('0');
	}));
});
