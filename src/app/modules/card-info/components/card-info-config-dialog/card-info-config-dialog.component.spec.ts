import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardInfoConfigDialogComponent } from './card-info-config-dialog.component';

describe('CardInfoConfigDialogComponent', () => {
  let component: CardInfoConfigDialogComponent;
  let fixture: ComponentFixture<CardInfoConfigDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInfoConfigDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardInfoConfigDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
