import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { PlansApiService } from './plans.api';

describe('PlansApiService', () => {
    let service: PlansApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(PlansApiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
