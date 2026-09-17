import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { UserProfile } from './user-profile';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('UserProfile', () => {
    let component: UserProfile;
    let fixture: ComponentFixture<UserProfile>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [UserProfile],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(UserProfile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
