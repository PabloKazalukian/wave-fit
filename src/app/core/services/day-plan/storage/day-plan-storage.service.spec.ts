import { TestBed } from '@angular/core/testing';

import { DayPlanStorageService } from './day-plan-storage.service';

describe('DayPlanStorageService', () => {
  let service: DayPlanStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DayPlanStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
