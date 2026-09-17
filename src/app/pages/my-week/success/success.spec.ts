import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Success } from './success';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Success', () => {
    let component: Success;
    let fixture: ComponentFixture<Success>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Success],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Success);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
