import {
	AfterViewInit,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild
} from '@angular/core';
import {UntypedFormControl} from "@angular/forms";
import {debounceTime, distinctUntilChanged, Observable, startWith, switchMap} from "rxjs";
import {IPaginatedResponse} from "../../types/IPaginatedResponse";
import {MatAutocompleteTrigger} from '@angular/material/autocomplete';

@Component({
	selector: 'app-input-autocomplete',
	templateUrl: './input-autocomplete.component.html',
	styleUrls: ['./input-autocomplete.component.scss'],
})
export class InputAutocompleteComponent<T> implements OnInit, AfterViewInit {

	public selectedValue: UntypedFormControl = new UntypedFormControl('');
	public filteredOptions: Observable<T[]>;

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

	@Input()
	public autoFocus: boolean = false;

	@Input({required: true})
	public primaryDisplayProperty: keyof T;

	@Input()
	public secondaryDisplayProperty: keyof T;

	@Output()
	public valueChange: EventEmitter<T> = new EventEmitter<T>();

	@ViewChild('inputElement')
	public inputElement: ElementRef;

	@ViewChild(MatAutocompleteTrigger)
	public autocompleteTrigger: MatAutocompleteTrigger;
  
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

	public ngAfterViewInit(): void {
		if(this.autoFocus) {
			setTimeout(() => {
				this.inputElement.nativeElement.focus();
				this.autocompleteTrigger.closePanel();
			}, 100)
		}
	}

	protected async getData(search: string): Promise<T[]> {
		return (await this.dataLoader(search)).data;
	}
    
	public propagateValue(value: T): void {
		this.valueChange.emit(value);
	}

}
