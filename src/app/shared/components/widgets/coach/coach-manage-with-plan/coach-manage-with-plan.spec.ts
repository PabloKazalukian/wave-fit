import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Apollo } from 'apollo-angular';

import { CoachManageWithPlan } from './coach-manage-with-plan';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { TrainingPlanDetail } from '../../../../interfaces/coach.interface';

describe('CoachManageWithPlan', () => {
    let component: CoachManageWithPlan;
    let fixture: ComponentFixture<CoachManageWithPlan>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [CoachManageWithPlan],
            providers: [{ provide: Apollo, useValue: apolloMock }, provideRouter([])],
        }).compileComponents();

        fixture = TestBed.createComponent(CoachManageWithPlan);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('planData', {
            id: 'plan-1',
            title: 'Test plan',
            version: 1,
            focus: '',
            aiSnapshot: { rawResponse: { days: [] } },
        } as unknown as TrainingPlanDetail);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
