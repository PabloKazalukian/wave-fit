import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { Weight } from './weight';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('Weight', () => {
    let component: Weight;
    let fixture: ComponentFixture<Weight>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [Weight],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(Weight);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
