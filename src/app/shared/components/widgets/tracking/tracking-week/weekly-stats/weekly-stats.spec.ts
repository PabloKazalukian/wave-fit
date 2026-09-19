import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { WeeklyStats } from './weekly-stats';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('WeeklyStats', () => {
    let component: WeeklyStats;
    let fixture: ComponentFixture<WeeklyStats>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WeeklyStats],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(WeeklyStats);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
