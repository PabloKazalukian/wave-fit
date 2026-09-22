import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionCreate } from './extra-session-create';
import { apolloMock } from '../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../core/services/workouts/workout-store.interface';
import { ExtraSessionDisciplineConfig } from '../../../../../shared/interfaces/extra-session.interface';

describe('ExtraSessionCreate', () => {
    let component: ExtraSessionCreate;
    let fixture: ComponentFixture<ExtraSessionCreate>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionCreate],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionCreate);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('config', {
            label: 'Test',
        } as unknown as ExtraSessionDisciplineConfig);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('renders a notes field bound to the shared form (FR-002)', () => {
        const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

        expect(textarea).toBeTruthy();
        expect(textarea.value).toBe('');

        component.notesControl.setValue('Salí a correr 5k');
        fixture.detectChanges();

        expect(textarea.value).toBe('Salí a correr 5k');
    });
});
