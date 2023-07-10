import {AfterViewInit, Component, Input, OnInit, ViewChild} from '@angular/core';
import {
	ITransactionStatistics,
	ITransactionStatisticsGoods
} from '../../services/transaction/types/ITransactionStatistics';
import {MatTableDataSource} from '@angular/material/table';
import {MatSort} from '@angular/material/sort';
import {MatPaginator} from '@angular/material/paginator';

@Component({
	selector: 'app-statistics-table',
	templateUrl: './statistics-table.component.html',
	styleUrls: ['./statistics-table.component.scss']
})
export class StatisticsTableComponent implements OnInit, AfterViewInit {

	@ViewChild(MatPaginator)
	public paginator: MatPaginator;
	@ViewChild(MatSort)
	public sort: MatSort;
	public displayedColumns: string[] = ['goodsName', 'sumGoods', 'sumPrice'];
	public dataSource: MatTableDataSource<ITransactionStatisticsGoods>;
	public dataTotal: number = 0;

	private _data: ITransactionStatistics;

	public get data(): ITransactionStatistics {
		return this._data;
	}

	@Input()
	public set data(value: ITransactionStatistics) {
		this._data = value;
		this.loadDataSource(value.goods);
	}

	public ngOnInit(): void {
		this.loadDataSource(this.data.goods);
		this.dataTotal = this.data.goods.length;
	}

	public ngAfterViewInit(): void {
		this.dataSource.paginator = this.paginator;
		this.dataSource.sort = this.sort;
	}

	private loadDataSource(data: ITransactionStatisticsGoods[]): void {
		if(!this.dataSource) {
			this.dataSource = new MatTableDataSource(data);
		} else {
			this.dataSource.data = data;
		}
	}
}
