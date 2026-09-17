import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { StrengthMetrics } from './strength-metrics';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('StrengthMetrics', () => {
    let component: StrengthMetrics;
    let fixture: ComponentFixture<StrengthMetrics>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StrengthMetrics],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(StrengthMetrics);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
