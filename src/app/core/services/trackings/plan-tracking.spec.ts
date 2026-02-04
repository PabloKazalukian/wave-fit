import { TestBed } from '@angular/core/testing';

import { PlanTracking } from './plan-tracking';

describe('PlanTracking', () => {
  let service: PlanTracking;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanTracking);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
