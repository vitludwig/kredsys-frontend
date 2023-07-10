import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
	selector: 'app-filter-panel',
	templateUrl: './filter-panel.component.html',
	styleUrls: ['./filter-panel.component.scss']
})
export class FilterPanelComponent {
	@Input()
	public filter: number[] = [];

	@Output()
	public filterChange: EventEmitter<number[]> = new EventEmitter<number[]>();

	@Input()
	public itemTypes: Record<number, {name: string; id: number}>;

	protected toggleFilter(type: number): void {
		if(this.filter.includes(type)) {
			this.filter = this.filter.filter((obj) => obj !== type);
		} else {
			this.filter = [...this.filter, type];
		}

		this.filterChange.emit(this.filter);
	}

	protected clearFilter(): void {
		this.filter = [];
		this.filterChange.emit(this.filter);
	}
}
