import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { PlansService } from './plans.service';

describe('PlansService', () => {
    let service: PlansService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(PlansService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
