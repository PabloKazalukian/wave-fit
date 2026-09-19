import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ActivationSelector } from './activation-selector';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('ActivationSelector', () => {
    let component: ActivationSelector;
    let fixture: ComponentFixture<ActivationSelector>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ActivationSelector],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(ActivationSelector);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
