import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoodsTypeDetailComponent } from './goods-type-detail.component';

describe('GoodsTypeDetailComponent', () => {
  let component: GoodsTypeDetailComponent;
  let fixture: ComponentFixture<GoodsTypeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GoodsTypeDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GoodsTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
