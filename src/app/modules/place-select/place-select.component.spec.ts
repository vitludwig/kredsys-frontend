import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaceSelectComponent } from './place-select.component';

describe('PlaceSelectComponent', () => {
  let component: PlaceSelectComponent;
  let fixture: ComponentFixture<PlaceSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaceSelectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaceSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
