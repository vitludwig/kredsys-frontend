import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {ESaleItemType} from '../../../../../../../sale/types/ESaleItemType';
import {IGoods} from '../../../../../../../../common/types/IGoods';
import {GoodsService} from '../../../../../../services/goods/goods.service';
import {AlertService} from '../../../../../../../../common/services/alert/alert.service';
import {FormControl} from "@angular/forms";
import {ReplaySubject, Subject, takeUntil} from "rxjs";
import {StringUtils} from "../../../../../../../../common/utils/StringUtils";

@Component({
	selector: 'app-sortiment-detail',
	templateUrl: './sortiment-detail.component.html',
	styleUrls: ['./sortiment-detail.component.scss'],
})
export class SortimentDetailComponent implements OnInit, OnDestroy {
	public allGoods: IGoods[] = [];

	public isLoading: boolean = true;

  public filteredGoods: ReplaySubject<IGoods[]> = new ReplaySubject<IGoods[]>(1);
  public selectedOptions = new FormControl<IGoods[]>([]);
  public selectedOptionsFilter: FormControl<string | null> = new FormControl<string | null>('');

	public readonly ESaleItemType = ESaleItemType;

	@ViewChild('itemInput')
	public itemInput: ElementRef<HTMLInputElement>;

  private onDestroy = new Subject<void>();

	constructor(
		public goodsService: GoodsService,
		protected dialogRef: MatDialogRef<SortimentDetailComponent>,
		protected alertService: AlertService,
		@Inject(MAT_DIALOG_DATA) protected data: { existingItems: IGoods[] },
	) {
	}

	public async ngOnInit(): Promise<void> {
		try {
			this.isLoading = true;
			const existingItemsId = this.data.existingItems.map((obj) => obj.id);
			this.allGoods = (await this.goodsService.getAllGoods())
				.filter((obj) => !existingItemsId.includes(obj.id));
      this.filteredGoods.next(this.allGoods.slice());
		} catch(e) {
			this.alertService.error('Nepodařilo se načíst zboží');
			console.error('Cannot load goods: ', e);
		} finally {
			this.isLoading = false;
		}

    this.selectedOptionsFilter.valueChanges
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => {
        this.filterGoods();
      });
	}

  protected filterGoods() {
    if (!this.allGoods) {
      return;
    }
    // get the search keyword
    let search = this.selectedOptionsFilter.value;
    if (!search) {
      this.filteredGoods.next(this.allGoods.slice());
      return;
    } else {
      search = StringUtils.removeAccents(search.toLowerCase());
    }

    this.filteredGoods.next(
      this.allGoods.filter(item => StringUtils.removeAccents(item.name.toLowerCase()).indexOf(search ?? "") > -1)
    );
  }

	public async onSubmit(): Promise<void> {
    this.dialogRef.close(this.selectedOptions.value);
	}

  ngOnDestroy() {
    this.onDestroy.next();
    this.onDestroy.complete();
  }

}
