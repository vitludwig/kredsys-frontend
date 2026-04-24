import {ComponentFixture, TestBed} from '@angular/core/testing';
import {GoodsListComponent} from './goods-list.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialogModule} from '@angular/material/dialog';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {of} from 'rxjs';
import {clearAllCaches} from '../../../../common/decorators/cache';

describe('GoodsListComponent', () => {
	let component: GoodsListComponent;
	let fixture: ComponentFixture<GoodsListComponent>;

	beforeEach(async () => {
		clearAllCaches();

		await TestBed.configureTestingModule({
			imports: [HttpClientTestingModule, MatSnackBarModule, MatDialogModule],
			declarations: [GoodsListComponent],
			providers: [
				{
					provide: ActivatedRoute,
					useValue: {snapshot: {paramMap: {get: () => '1'}}, params: of({})},
				},
			],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(GoodsListComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
