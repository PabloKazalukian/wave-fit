import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Avatar } from './avatar';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('Avatar', () => {
    let component: Avatar;
    let fixture: ComponentFixture<Avatar>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Avatar],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Avatar);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
