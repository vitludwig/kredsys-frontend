import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { AlertService } from './alert.service';

describe('AlertService', () => {
	let service: AlertService;
	let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

	beforeEach(() => {
		mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
		mockSnackBar.open.and.returnValue({} as any);

		TestBed.configureTestingModule({
			providers: [
				AlertService,
				{ provide: MatSnackBar, useValue: mockSnackBar },
			],
		});

		service = TestBed.inject(AlertService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	it('success() should call snackbar.open with success panelClass', () => {
		service.success('Operation succeeded');
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Operation succeeded',
			'',
			jasmine.objectContaining({ panelClass: ['mdc-snackbar--success', 'alert-success'] }),
		);
	});

	it('error() should call snackbar.open with danger panelClass', () => {
		service.error('Something failed');
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Something failed',
			'',
			jasmine.objectContaining({ panelClass: ['mdc-snackbar--danger', 'alert-error'] }),
		);
	});

	it('should use default duration of 3000', () => {
		service.success('Test');
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Test',
			'',
			jasmine.objectContaining({ duration: 3000 }),
		);
	});

	it('success() should merge custom config while keeping panelClass', () => {
		const customConfig: MatSnackBarConfig = { duration: 5000 };
		service.success('Test', customConfig);
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Test',
			'',
			jasmine.objectContaining({ duration: 5000, panelClass: ['mdc-snackbar--success', 'alert-success'] }),
		);
	});

	it('success() should NOT allow custom config to override panelClass', () => {
		const customConfig: MatSnackBarConfig = { panelClass: 'custom-class' };
		service.success('Test', customConfig);
		const callArgs = mockSnackBar.open.calls.mostRecent().args;
		expect(callArgs[2]!.panelClass).toEqual(['mdc-snackbar--success', 'alert-success']);
	});

	it('error() should NOT allow custom config to override panelClass', () => {
		const customConfig: MatSnackBarConfig = { panelClass: 'custom-class' };
		service.error('Test', customConfig);
		const callArgs = mockSnackBar.open.calls.mostRecent().args;
		expect(callArgs[2]!.panelClass).toEqual(['mdc-snackbar--danger', 'alert-error']);
	});

	it('should pass action string to snackbar.open for success', () => {
		service.success('Test', undefined, 'Undo');
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Test',
			'Undo',
			jasmine.anything(),
		);
	});

	it('should pass action string to snackbar.open for error', () => {
		service.error('Error occurred', undefined, 'Retry');
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Error occurred',
			'Retry',
			jasmine.anything(),
		);
	});

	it('error() should merge custom config while keeping panelClass', () => {
		const customConfig: MatSnackBarConfig = { duration: 10000 };
		service.error('Error', customConfig);
		expect(mockSnackBar.open).toHaveBeenCalledWith(
			'Error',
			'',
			jasmine.objectContaining({ duration: 10000, panelClass: ['mdc-snackbar--danger', 'alert-error'] }),
		);
	});
});
