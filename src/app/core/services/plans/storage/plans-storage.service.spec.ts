import { TestBed } from '@angular/core/testing';

import { PlansStorageService } from './plans.storage';

describe('PlansStorageService', () => {
    let service: PlansStorageService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlansStorageService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
