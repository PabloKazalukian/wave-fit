import { TestBed } from '@angular/core/testing';

import { RoutinesApiService } from './routines-api.service';

describe('RoutinesApiService', () => {
  let service: RoutinesApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoutinesApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
