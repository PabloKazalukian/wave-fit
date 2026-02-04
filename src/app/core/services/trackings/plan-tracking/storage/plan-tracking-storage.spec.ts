import { TestBed } from '@angular/core/testing';

import { PlanTrackingStorage } from './plan-tracking-storage';

describe('PlanTrackingStorage', () => {
  let service: PlanTrackingStorage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanTrackingStorage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
