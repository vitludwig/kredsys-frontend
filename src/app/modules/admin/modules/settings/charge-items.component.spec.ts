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
  });

  it('addItem appends an empty item', () => {
    const initialCount = component['items'].length;
    component.addItem();
    expect(component['items'].length).toBe(initialCount + 1);
    expect(component['items'].at(-1)).toEqual({ label: '', amount: 0 });
  });

  it('removeItem removes item at given index', () => {
    component['items'] = [{ label: 'A', amount: 10 }, { label: 'B', amount: 20 }];
    component.removeItem(0);
    expect(component['items']).toEqual([{ label: 'B', amount: 20 }]);
  });

  it('save calls saveChargeItems with trimmed labels and shows success', async () => {
    component['items'] = [{ label: '  Kelímek  ', amount: 60 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).toHaveBeenCalledWith([{ label: 'Kelímek', amount: 60 }]);
    expect(mockAlertService.success).toHaveBeenCalled();
  });

  it('save updates labels in-place after successful save (preserves object refs)', async () => {
    const item = { label: '  Kelímek  ', amount: 60 };
    component['items'] = [item];
    await component.save();
    expect(item.label).toBe('Kelímek');
  });

  it('save shows error and does not save when a label is empty', async () => {
    component['items'] = [{ label: '', amount: 60 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
    expect(mockAlertService.error).toHaveBeenCalled();
  });

  it('save shows error when labels are duplicate (case-insensitive)', async () => {
    component['items'] = [{ label: 'Pivo', amount: 60 }, { label: 'pivo', amount: 80 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
    expect(mockAlertService.error).toHaveBeenCalled();
  });

  it('save shows error when amount is not positive', async () => {
    component['items'] = [{ label: 'Kelímek', amount: 0 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
    expect(mockAlertService.error).toHaveBeenCalled();
  });

  it('save shows error when amount exceeds maximum', async () => {
    component['items'] = [{ label: 'Kelímek', amount: 200_000 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
    expect(mockAlertService.error).toHaveBeenCalled();
  });

  it('save shows error when amount is not an integer', async () => {
    component['items'] = [{ label: 'Kelímek', amount: 1.5 }];
    await component.save();
    expect(mockSettingsService.saveChargeItems).not.toHaveBeenCalled();
    expect(mockAlertService.error).toHaveBeenCalled();
  });

  it('save shows error alert on service failure and does not update items', async () => {
    const item = { label: 'Kelímek', amount: 60 };
    component['items'] = [item];
    mockSettingsService.saveChargeItems.and.returnValue(Promise.reject(new Error('fail')));
    await component.save();
    expect(mockAlertService.error).toHaveBeenCalled();
    expect(item.label).toBe('Kelímek'); // not trimmed yet — save failed
  });

  it('isSaving is false after save completes', async () => {
    component['items'] = [{ label: 'Kelímek', amount: 60 }];
    await component.save();
    expect(component['isSaving']).toBeFalse();
  });
});
