import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ErrorMessageComponent} from './error-message.component';
import {FormControl} from '@angular/forms';
import {ComponentRef} from '@angular/core';

describe('ErrorMessageComponent', () => {
	let component: ErrorMessageComponent;
	let fixture: ComponentFixture<ErrorMessageComponent>;
	let componentRef: ComponentRef<ErrorMessageComponent>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [ErrorMessageComponent],
			schemas: [NO_ERRORS_SCHEMA],
		}).compileComponents();

		fixture = TestBed.createComponent(ErrorMessageComponent);
		component = fixture.componentInstance;
		componentRef = fixture.componentRef;
		componentRef.setInput('control', {control: new FormControl()});
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
