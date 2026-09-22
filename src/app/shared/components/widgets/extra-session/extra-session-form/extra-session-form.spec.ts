import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';

import { ExtraSessionForm } from './extra-session-form';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';

describe('ExtraSessionForm', () => {
    let component: ExtraSessionForm;
    let fixture: ComponentFixture<ExtraSessionForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionForm],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionForm);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('sends the notes control value on save (FR-002)', () => {
        const service = fixture.debugElement.injector.get(ExtraSessionService);
        spyOn(service, 'create').and.returnValue(of(null));

        component.categoryControl.setValue('Cardio');
        component.disciplineControl.setValue('running');
        component.durationControl.setValue(30);
        component.intensityLevelControl.setValue(3);
        component.caloriesControl.setValue(100);
        component.notesControl.setValue('Salí a correr 5k');

        component.save();

        expect(service.create).toHaveBeenCalledWith(
            jasmine.objectContaining({ notes: 'Salí a correr 5k' }),
        );
    });
});
