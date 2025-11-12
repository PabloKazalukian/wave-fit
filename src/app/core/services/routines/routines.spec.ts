import { TestBed } from '@angular/core/testing';

import { Routines } from './routines';

describe('Routines', () => {
  let service: Routines;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Routines);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
