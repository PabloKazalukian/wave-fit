import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListPlanTrackings } from './list-plan-trackings';

describe('ListPlanTrackings', () => {
  let component: ListPlanTrackings;
  let fixture: ComponentFixture<ListPlanTrackings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListPlanTrackings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListPlanTrackings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
