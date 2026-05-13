import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChargeItemsComponent } from './charge-items.component';
import { SettingsService } from '../../services/settings/settings.service';
import { AlertService } from '../../../../common/services/alert/alert.service';

describe('ChargeItemsComponent', () => {
	let component: ChargeItemsComponent;
	let fixture: ComponentFixture<ChargeItemsComponent>;
	let mockSettingsService: jasmine.SpyObj<SettingsService>;
	let mockAlertService: jasmine.SpyObj<AlertService>;

	beforeEach(async () => {
		mockSettingsService = jasmine.createSpyObj('SettingsService', [
			'getChargeItems',
			'saveChargeItems',
		]);
		mockSettingsService.getChargeItems.and.returnValue(Promise.resolve([
			{ label: 'Kelímek', amount: 60 },
		]));
		mockSettingsService.saveChargeItems.and.returnValue(Promise.resolve());

		mockAlertService = jasmine.createSpyObj('AlertService', ['success', 'error']);

		await TestBed.configureTestingModule({
			imports: [ChargeItemsComponent, NoopAnimationsModule],
			providers: [
				{ provide: SettingsService, useValue: mockSettingsService },
				{ provide: AlertService, useValue: mockAlertService },
			],
		}).compileComponents();

		fixture = TestBed.createComponent(ChargeItemsComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
		await fixture.whenStable();
		fixture.detectChanges();
	});

	it('should create and load items on init', () => {
		expect(component).toBeTruthy();
		expect(mockSettingsService.getChargeItems).toHaveBeenCalled();
		expect(component['isLoading']).toBeFalse();
		expect(component['viewModels'].length).toBe(1);
		expect(component['viewModels'][0]).toEqual(
			jasmine.objectContaining({ data: { label: 'Kelímek', amount: 60 }, editing: false, isNew: false })
		);
	});

	it('addItem appends a new editing vm', () => {
		const initialCount = component['viewModels'].length;
		component.addItem();
		expect(component['viewModels'].length).toBe(initialCount + 1);
		const added = component['viewModels'].at(-1)!;
		expect(added.data).toEqual({ label: '', amount: 0 });
		expect(added.editing).toBeTrue();
		expect(added.isNew).toBeTrue();
	});

	it('removeItem removes vm at given index', () => {
		component['viewModels'] = [
			{ data: { label: 'A', amount: 10 }, editing: false, isNew: false },
			{ data: { label: 'B', amount: 20 }, editing: false, isNew: false },
		];
		component.removeItem(0);
		expect(component['viewModels'].length).toBe(1);
		expect(component['viewModels'][0].data.label).toBe('B');
	});

	describe('toggleEdit', () => {
		it('opens edit mode and snapshots original', () => {
			component['viewModels'] = [
				{ data: { label: 'Kelímek', amount: 60 }, editing: false, isNew: false },
			];
			component.toggleEdit(0);
			const vm = component['viewModels'][0];
			expect(vm.editing).toBeTrue();
			expect(vm.original).toEqual({ label: 'Kelímek', amount: 60 });
		});

		it('cancels edit and reverts to original', () => {
			component['viewModels'] = [
				{ data: { label: 'Kelímek', amount: 60 }, editing: true, isNew: false, original: { label: 'Kelímek', amount: 60 } },
			];
			component['viewModels'][0].data.label = 'Changed';
			component.toggleEdit(0);
			const vm = component['viewModels'][0];
			expect(vm.editing).toBeFalse();
			expect(vm.data.label).toBe('Kelímek');
		});
	});

	it('save calls saveChargeItems with trimmed labels and shows success', async () => {
		component['viewModels'] = [
			{ data: { label: '  Kelímek  ', amount: 60 }, editing: true, isNew: false },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).toHaveBeenCalledWith([{ label: 'Kelímek', amount: 60 }]);
		expect(mockAlertService.success).toHaveBeenCalled();
	});

	it('save updates label in-place and clears editing/isNew flags after successful save', async () => {
		const vm = { data: { label: '  Kelímek  ', amount: 60 }, editing: true, isNew: true };
		component['viewModels'] = [vm];
		await component.save();
		expect(vm.data.label).toBe('Kelímek');
		expect(vm.editing).toBeFalse();
		expect(vm.isNew).toBeFalse();
	});

	it('save shows error and does not save when a label is empty', async () => {
		component['viewModels'] = [
			{ data: { label: '', amount: 60 }, editing: true, isNew: true },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
		expect(mockAlertService.error).toHaveBeenCalled();
	});

	it('save shows error when labels are duplicate (case-insensitive)', async () => {
		component['viewModels'] = [
			{ data: { label: 'Pivo', amount: 60 }, editing: false, isNew: false },
			{ data: { label: 'pivo', amount: 80 }, editing: false, isNew: false },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
		expect(mockAlertService.error).toHaveBeenCalled();
	});

	it('save shows error when amount is not positive', async () => {
		component['viewModels'] = [
			{ data: { label: 'Kelímek', amount: 0 }, editing: true, isNew: true },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
		expect(mockAlertService.error).toHaveBeenCalled();
	});

	it('save shows error when amount exceeds maximum', async () => {
		component['viewModels'] = [
			{ data: { label: 'Kelímek', amount: 200_000 }, editing: true, isNew: true },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
		expect(mockAlertService.error).toHaveBeenCalled();
	});

	it('save shows error when amount is not an integer', async () => {
		component['viewModels'] = [
			{ data: { label: 'Kelímek', amount: 1.5 }, editing: true, isNew: true },
		];
		await component.save();
		expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
		expect(mockAlertService.error).toHaveBeenCalled();
	});

	it('save shows error alert on service failure and does not update label', async () => {
		const vm = { data: { label: 'Kelímek', amount: 60 }, editing: false, isNew: false };
		component['viewModels'] = [vm];
		mockSettingsService.saveChargeItems.and.returnValue(Promise.reject(new Error('fail')));
		await component.save();
		expect(mockAlertService.error).toHaveBeenCalled();
		expect(vm.data.label).toBe('Kelímek');
	});

	it('isSaving is false after save completes', async () => {
		component['viewModels'] = [
			{ data: { label: 'Kelímek', amount: 60 }, editing: false, isNew: false },
		];
		await component.save();
		expect(component['isSaving']).toBeFalse();
	});
});
