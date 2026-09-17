import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionApi } from './extra-session.api';

describe('ExtraSessionApi', () => {
    let service: ExtraSessionApi;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [{ provide: Apollo, useValue: {} }],
        });
        service = TestBed.inject(ExtraSessionApi);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
