import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { TrainingPerformance } from './training-performance';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';

describe('TrainingPerformance', () => {
    let component: TrainingPerformance;
    let fixture: ComponentFixture<TrainingPerformance>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TrainingPerformance],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(TrainingPerformance);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
