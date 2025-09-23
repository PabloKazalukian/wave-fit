import { TestBed } from '@angular/core/testing';

import { Credentials } from './credentials';

describe('Credentials', () => {
  let service: Credentials;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Credentials);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
