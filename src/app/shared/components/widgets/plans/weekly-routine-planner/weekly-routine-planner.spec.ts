import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { WeeklyRoutinePlannerComponent } from './weekly-routine-planner';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('WeeklyRoutinePlanner', () => {
    let component: WeeklyRoutinePlannerComponent;
    let fixture: ComponentFixture<WeeklyRoutinePlannerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [WeeklyRoutinePlannerComponent],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(WeeklyRoutinePlannerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
