import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { Register } from './register';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Register', () => {
    let component: Register;
    let fixture: ComponentFixture<Register>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Register],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
