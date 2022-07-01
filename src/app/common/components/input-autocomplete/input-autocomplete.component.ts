import {Component, EventEmitter, forwardRef, Input, OnInit, Output} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from "@angular/forms";
import {debounceTime, distinctUntilChanged, Observable, startWith, switchMap} from "rxjs";
import {IPaginatedResponse} from "../../types/IPaginatedResponse";

@Component({
	selector: 'app-input-autocomplete',
	templateUrl: './input-autocomplete.component.html',
	styleUrls: ['./input-autocomplete.component.scss'],

})
export class InputAutocompleteComponent<T> implements OnInit {
	
	public selectedValue: FormControl = new FormControl('');
	public filterBy: Partial<unknown> = {};
	public filteredOptions: Observable<any>;

	@Input()
	public label: string = '';

	@Input()
	public placeholder: string = 'Vyhledat';

	@Input()
	public class: string = '';

	@Input()
	public dataLoader: (search: string) => Promise<IPaginatedResponse<T>>;

	@Input()
	public value: T;

	@Output()
	public valueChange: EventEmitter<T> = new EventEmitter<T>();
  
	constructor() { }

	public ngOnInit(): void {
		this.filteredOptions = this.selectedValue.valueChanges
			.pipe(
				startWith(''),
				debounceTime(400),
				distinctUntilChanged(),
				switchMap((value) => {
					return this.getData(value || '');
				})
			);
	}

	public filterData(value: string): Promise<T[]> {
		// call the service which makes the http-request
		return this.getData(value);
	}

	protected async getData(search: string): Promise<T[]> {
		return (await this.dataLoader(search)).data;
	}
    
	public propagateValue(value: T): void {
		this.valueChange.emit(value);
		// this.onTouch();
		// this.onChange(value);
	}

	public onChange: (_: any) => void = (_: any) => {};
	public onTouch: () => void = () => {};

	public registerOnChange(fn: any): void {
		this.onChange = fn;
	}

	public registerOnTouched(fn: any): void {
		this.onTouch = fn;
	}

	public writeValue(value: T): void {
		this.selectedValue.setValue(value);
	}

}
