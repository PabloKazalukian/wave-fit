import { TestBed } from '@angular/core/testing';

import { ExtraSessionService } from './extra-session.service';

describe('ExtraSessionService', () => {
  let service: ExtraSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ExtraSessionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
