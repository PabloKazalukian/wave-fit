import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';

import { ExtraSessionCard } from './extra-session-card';
import { apolloMock } from '../../../../../../core/testing/apollo.mock';
import { workoutStoreMock } from '../../../../../../core/testing/workout-store.mock';
import { WORKOUT_STORE } from '../../../../../../core/services/workouts/workout-store.interface';
import { ExtraSession } from '../../../../../interfaces/extra-session.interface';

describe('ExtraSessionCard', () => {
    let component: ExtraSessionCard;
    let fixture: ComponentFixture<ExtraSessionCard>;

    const sessionWithNotes = {
        id: 'extra-1',
        notes: 'Salí a correr 5k',
        duration: 30,
        intensityLevel: 3,
        calories: 0,
        discipline: 'running',
    } as unknown as ExtraSession;

    const sessionWithoutNotes = {
        id: 'extra-1',
        duration: 30,
        intensityLevel: 3,
        calories: 0,
        discipline: 'running',
    } as unknown as ExtraSession;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExtraSessionCard],
            providers: [
                { provide: Apollo, useValue: apolloMock },
                { provide: WORKOUT_STORE, useValue: workoutStoreMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraSessionCard);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('session', sessionWithNotes);
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('shows the session notes when present (FR-008)', () => {
        expect(fixture.nativeElement.textContent).toContain('Salí a correr 5k');
    });

    it('does not render a notes block when the session has none', () => {
        fixture.componentRef.setInput('session', sessionWithoutNotes);
        fixture.detectChanges();

        expect(fixture.nativeElement.textContent).not.toContain('Notas');
    });

    it('prefills the notes field in edit mode and emits them on save (FR-008)', () => {
        const editBtn = Array.from(
            fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>,
        ).find((b: HTMLButtonElement) =>
            (b.textContent ?? '').includes('Modificar'),
        ) as HTMLButtonElement;
        editBtn.click();
        fixture.detectChanges();

        const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
        expect(textarea.value).toBe('Salí a correr 5k');

        const saved = jasmine.createSpy('saved');
        component.save.subscribe(saved);

        component.notesControl.setValue('Nota editada');
        component.onSave();

        expect(saved).toHaveBeenCalledWith(
            jasmine.objectContaining({ id: 'extra-1', notes: 'Nota editada' }),
        );
    });
});
