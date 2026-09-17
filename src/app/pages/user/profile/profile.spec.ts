import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Profile } from './profile';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Profile', () => {
    let component: Profile;
    let fixture: ComponentFixture<Profile>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Profile],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Profile);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
