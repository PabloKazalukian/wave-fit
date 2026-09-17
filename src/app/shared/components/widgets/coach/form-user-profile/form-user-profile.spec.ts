import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { FormUserProfile } from './form-user-profile';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('FormUserProfile', () => {
    let component: FormUserProfile;
    let fixture: ComponentFixture<FormUserProfile>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FormUserProfile],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(FormUserProfile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
