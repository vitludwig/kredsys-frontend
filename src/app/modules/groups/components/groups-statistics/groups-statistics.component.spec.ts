import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupsStatisticsComponent } from './groups-statistics.component';

describe('GroupsStatisticsComponent', () => {
  let component: GroupsStatisticsComponent;
  let fixture: ComponentFixture<GroupsStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupsStatisticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(GroupsStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
