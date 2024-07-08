import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimatedLoaderComponent } from './animated-loader.component';

describe('LoaderComponent', () => {
  let component: AnimatedLoaderComponent;
  let fixture: ComponentFixture<AnimatedLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimatedLoaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnimatedLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
