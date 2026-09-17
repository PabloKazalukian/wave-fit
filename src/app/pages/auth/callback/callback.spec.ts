import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Callback } from './callback';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Callback', () => {
    let component: Callback;
    let fixture: ComponentFixture<Callback>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Callback],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Callback);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
