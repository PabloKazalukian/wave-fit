import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Home } from './home';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('Home', () => {
    let component: Home;
    let fixture: ComponentFixture<Home>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Home],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Home);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
