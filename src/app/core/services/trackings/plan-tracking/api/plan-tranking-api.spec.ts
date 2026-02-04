import { TestBed } from '@angular/core/testing';

import { PlanTrankingApi } from './plan-tranking-api';

describe('PlanTrankingApi', () => {
  let service: PlanTrankingApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanTrankingApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
