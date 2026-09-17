import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Resource } from './resource';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('Resource', () => {
    let component: Resource;
    let fixture: ComponentFixture<Resource>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Resource],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Resource);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
