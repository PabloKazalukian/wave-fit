import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Show } from './show';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Show', () => {
    let component: Show;
    let fixture: ComponentFixture<Show>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Show],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Show);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
