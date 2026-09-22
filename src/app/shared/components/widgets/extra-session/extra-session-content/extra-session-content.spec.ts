import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';

import { ExtraSessionContent } from './extra-session-content';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { ExtraSession } from '../../../../../shared/interfaces/extra-session.interface';

describe('ExtraSessionContent', () => {
    let component: ExtraSessionContent;
    let fixture: ComponentFixture<ExtraSessionContent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionContent],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionContent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('forwards the edited notes to update (FR-008)', () => {
        const service = fixture.debugElement.injector.get(ExtraSessionService);
        spyOn(service, 'update').and.returnValue(of({} as ExtraSession));

        component.updateExtraSession({
            id: 'x-1',
            duration: 45,
            intensityLevel: 4,
            calories: 200,
            notes: 'Salí a correr 5k',
        });

        expect(service.update).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'x-1', notes: 'Salí a correr 5k' }),
        );
    });
});
