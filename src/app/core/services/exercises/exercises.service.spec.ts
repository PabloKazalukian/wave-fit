import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExercisesService } from './exercises.service';

describe('ExercisesService', () => {
    let service: ExercisesService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(ExercisesService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
