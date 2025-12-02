import { TestBed } from '@angular/core/testing';

import { PlanFormBuilderService } from './plan-form-builder.service';

describe('PlanFormBuilderService', () => {
    let service: PlanFormBuilderService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PlanFormBuilderService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
