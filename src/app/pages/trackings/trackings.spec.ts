import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Trackings } from './trackings';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('Trackings', () => {
    let component: Trackings;
    let fixture: ComponentFixture<Trackings>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Trackings],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Trackings);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
