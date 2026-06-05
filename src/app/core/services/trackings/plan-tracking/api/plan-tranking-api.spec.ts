import { TestBed } from '@angular/core/testing';
import { PlanTrackingApi } from './plan-tranking.api';

describe('PlanTrackingApi', () => {
    let service: PlanTrackingApi;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlanTrackingApi);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
