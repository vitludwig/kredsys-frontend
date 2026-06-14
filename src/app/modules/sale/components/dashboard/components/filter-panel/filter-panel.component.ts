import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
	selector: 'app-filter-panel',
	templateUrl: './filter-panel.component.html',
	styleUrls: ['./filter-panel.component.scss'],
	standalone: false
})
export class FilterPanelComponent {
	@Input()
	public set filter(value: number[]) {
		this.selectedType = value.length > 0 ? value[0] : null;
	}

	@Output()
	public filterChange = new EventEmitter<number[]>();

	@Input()
	public itemTypes: Record<number, {name: string; id: number}>;

	protected selectedType: number | null = null;

	protected onTypeChange(value: number | null): void {
		this.filterChange.emit(value !== null ? [value] : []);
	}
}
