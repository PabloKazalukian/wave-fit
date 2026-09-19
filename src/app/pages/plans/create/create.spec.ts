import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Create } from './create';
import { apolloMock } from '../../../core/testing/apollo.mock';

describe('Create', () => {
    let component: Create;
    let fixture: ComponentFixture<Create>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Create],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Create);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
