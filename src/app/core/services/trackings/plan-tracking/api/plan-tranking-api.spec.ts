import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { PlanTrackingApi } from './plan-tranking.api';

describe('PlanTrackingApi', () => {
    let service: PlanTrackingApi;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(PlanTrackingApi);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
