import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { HealthConstraints } from './health-constraints';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('HealthConstraints', () => {
    let component: HealthConstraints;
    let fixture: ComponentFixture<HealthConstraints>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HealthConstraints],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(HealthConstraints);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
