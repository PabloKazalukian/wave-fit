import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ShowUserProfileData } from './show-user-profile-data';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('ShowUserProfileData', () => {
    let component: ShowUserProfileData;
    let fixture: ComponentFixture<ShowUserProfileData>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ShowUserProfileData],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ShowUserProfileData);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
