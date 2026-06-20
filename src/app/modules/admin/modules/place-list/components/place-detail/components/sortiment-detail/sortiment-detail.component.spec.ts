import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SortimentDetailComponent} from './sortiment-detail.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {clearAllCaches} from '../../../../../../../../common/decorators/cache';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import {GoodsService} from '../../../../../../services/goods/goods.service';
import {IGoods} from '../../../../../../../../common/types/IGoods';

function makeGoods(id: number, placeId: number | null): IGoods {
	return {
		id,
		name: `Goods ${id}`,
		goodsTypeId: null,
		price: 1,
		currencyId: null,
		placeId,
		deleted: false,
	};
}

describe('SortimentDetailComponent', () => {
	let component: SortimentDetailComponent;
	let fixture: ComponentFixture<SortimentDetailComponent>;

	async function setup(allGoods: IGoods[], data: { existingItems: IGoods[]; placeId?: number | null }) {
		clearAllCaches();

		await TestBed.configureTestingModule({
			declarations: [SortimentDetailComponent],
			schemas: [NO_ERRORS_SCHEMA],
			imports: [MatSnackBarModule, MatDialogModule],
			providers: [
				{ provide: MatDialogRef, useValue: {} },
				{ provide: MAT_DIALOG_DATA, useValue: data },
				{ provide: GoodsService, useValue: { getAllGoods: () => Promise.resolve(allGoods) } },
				provideHttpClient(withInterceptorsFromDi()),
				provideHttpClientTesting(),
			]
		}).compileComponents();

		fixture = TestBed.createComponent(SortimentDetailComponent);
		component = fixture.componentInstance;
	}

	it('should create', async () => {
		await setup([], { existingItems: [] });
		fixture.detectChanges();
		expect(component).toBeTruthy();
	});

	it('offers only global goods and goods local to this place', async () => {
		const placeId = 5;
		const global = makeGoods(1, null);
		const localToThisPlace = makeGoods(2, placeId);
		const localToOtherPlace = makeGoods(3, 99);

		await setup([global, localToThisPlace, localToOtherPlace], { existingItems: [], placeId });
		await component.ngOnInit();

		expect(component.allGoods.map((g) => g.id)).toEqual([1, 2]);
	});

	it('offers only global goods when creating a not-yet-saved place (no placeId)', async () => {
		const global = makeGoods(1, null);
		const localToSomePlace = makeGoods(2, 7);

		await setup([global, localToSomePlace], { existingItems: [] });
		await component.ngOnInit();

		expect(component.allGoods.map((g) => g.id)).toEqual([1]);
	});

	it('still excludes goods already assigned to the place', async () => {
		const placeId = 5;
		const global = makeGoods(1, null);
		const alreadyAssigned = makeGoods(2, placeId);

		await setup([global, alreadyAssigned], { existingItems: [alreadyAssigned], placeId });
		await component.ngOnInit();

		expect(component.allGoods.map((g) => g.id)).toEqual([1]);
	});
});
