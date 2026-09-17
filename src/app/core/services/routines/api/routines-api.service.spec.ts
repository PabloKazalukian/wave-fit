import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { RoutinesApiService } from './routines.api';

describe('RoutinesApiService', () => {
    let service: RoutinesApiService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(RoutinesApiService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
