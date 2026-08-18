import { TestBed } from '@angular/core/testing';

import { TrainingHistory } from './training-history';

describe('TrainingHistory', () => {
  let service: TrainingHistory;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrainingHistory);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
