import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { CoachService } from './coach.service';

describe('CoachService', () => {
    let service: CoachService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(CoachService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
