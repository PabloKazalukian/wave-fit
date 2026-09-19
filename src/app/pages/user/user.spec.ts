import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { User } from './user';
import { apolloMock } from '../../core/testing/apollo.mock';

describe('User', () => {
    let component: User;
    let fixture: ComponentFixture<User>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [User],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(User);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
