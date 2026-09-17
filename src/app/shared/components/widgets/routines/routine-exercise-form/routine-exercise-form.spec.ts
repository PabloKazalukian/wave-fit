import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { RoutineExerciseForm } from './routine-exercise-form';
import { apolloMock } from '../../../../../core/testing/apollo.mock';

describe('RoutineExerciseForm', () => {
    let component: RoutineExerciseForm;
    let fixture: ComponentFixture<RoutineExerciseForm>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RoutineExerciseForm],
            providers: [{ provide: Apollo, useValue: apolloMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(RoutineExerciseForm);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('categoryExercise', '');
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
