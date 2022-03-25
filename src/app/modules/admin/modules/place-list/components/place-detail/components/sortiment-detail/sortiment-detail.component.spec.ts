import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortimentDetailComponent } from './sortiment-detail.component';

describe('SortimentDetailComponent', () => {
  let component: SortimentDetailComponent;
  let fixture: ComponentFixture<SortimentDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SortimentDetailComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SortimentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
