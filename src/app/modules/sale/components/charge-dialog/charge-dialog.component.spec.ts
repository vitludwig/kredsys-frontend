import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChargeDialogComponent } from './charge-dialog.component';

describe('ChargeDialogComponent', () => {
  let component: ChargeDialogComponent;
  let fixture: ComponentFixture<ChargeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChargeDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChargeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
