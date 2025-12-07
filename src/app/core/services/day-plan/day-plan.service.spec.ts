import { TestBed } from '@angular/core/testing';

import { DayPlanService } from './day-plan.service';

describe('DayPlanService', () => {
    let service: DayPlanService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(DayPlanService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
