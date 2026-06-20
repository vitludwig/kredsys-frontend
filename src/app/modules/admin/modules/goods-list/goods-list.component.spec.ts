import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GoodsListComponent} from './goods-list.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('GoodsListComponent', () => {
	let component: GoodsListComponent;
	let fixture: ComponentFixture<GoodsListComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			declarations: [GoodsListComponent],
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

		fixture = TestBed.createComponent(GoodsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});

describe('GoodsListComponent openAddToPlace place scoping', () => {
	let component: GoodsListComponent;
	let placeServiceSpy: jasmine.SpyObj<any>;
	let dialogSpy: jasmine.SpyObj<any>;
	let alertSpy: jasmine.SpyObj<any>;

	const places = [
		{ id: 1, name: 'Bar 1' },
		{ id: 2, name: 'Bar 2' },
		{ id: 3, name: 'Bar 3' },
	];

	function dialogReturning(value: number | null): void {
		dialogSpy.open.and.returnValue({ afterClosed: () => of(value) } as any);
	}

	beforeEach(() => {
		placeServiceSpy = jasmine.createSpyObj('PlaceService', ['addGoods', 'removeGoods']);
		placeServiceSpy.addGoods.and.resolveTo(undefined);
		dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
		alertSpy = jasmine.createSpyObj('AlertService', ['error']);

		component = new GoodsListComponent(
			{} as any,            // route
			{} as any,            // goodsService
			{} as any,            // currencyService
			alertSpy,             // alertService
			placeServiceSpy,      // placeService
			dialogSpy,            // dialog
		);
		component.places = places as any;
		// updateRowPlaces re-emits through the data source after a successful add.
		(component as any).goodsDataSource = { data: [] };
	});

	it('global goods (placeId null) can be added to any place not already assigned', async () => {
		dialogReturning(2);
		const row = { id: 10, placeId: null, placeIds: [1] } as any;

		await component.openAddToPlace(row);

		const dialogData = dialogSpy.open.calls.mostRecent().args[1].data;
		expect(dialogData.places.map((p: any) => p.id)).toEqual([2, 3]);
	});

	it('local goods (placeId set) can only be added to its own placeId', async () => {
		dialogReturning(2);
		const row = { id: 11, placeId: 2, placeIds: [] } as any;

		await component.openAddToPlace(row);

		const dialogData = dialogSpy.open.calls.mostRecent().args[1].data;
		expect(dialogData.places.map((p: any) => p.id)).toEqual([2]);
	});

	it('local goods already on its own placeId shows error and does not open the dialog', async () => {
		const row = { id: 12, placeId: 2, placeIds: [2] } as any;

		await component.openAddToPlace(row);

		expect(dialogSpy.open).not.toHaveBeenCalled();
		expect(alertSpy.error).toHaveBeenCalled();
		expect(placeServiceSpy.addGoods).not.toHaveBeenCalled();
	});

	it('does not POST when the dialog is cancelled (returns null)', async () => {
		dialogReturning(null);
		const row = { id: 13, placeId: null, placeIds: [] } as any;

		await component.openAddToPlace(row);

		expect(placeServiceSpy.addGoods).not.toHaveBeenCalled();
	});

	it('does not POST when the dialog closes with an empty string', async () => {
		dialogReturning('' as any);
		const row = { id: 14, placeId: null, placeIds: [] } as any;

		await component.openAddToPlace(row);

		expect(placeServiceSpy.addGoods).not.toHaveBeenCalled();
	});
});
