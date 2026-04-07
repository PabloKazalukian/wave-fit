import { TestBed } from '@angular/core/testing';

import { ExtraSessionApi } from './extra-session.api';

describe('ExtraSessionApi', () => {
  let service: ExtraSessionApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtraSessionApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
