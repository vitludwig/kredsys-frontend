import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardInfoPublicComponent } from './card-info-public.component';

describe('CardInfoPublicComponent', () => {
  let component: CardInfoPublicComponent;
  let fixture: ComponentFixture<CardInfoPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardInfoPublicComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CardInfoPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
