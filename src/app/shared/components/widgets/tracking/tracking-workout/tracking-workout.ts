import { Component, HostListener, ElementRef, inject, signal } from '@angular/core';
import { ExerciseSelector } from '../../exercises/exercise-selector/exercise-selector';
import { options } from '../../../../interfaces/input.interface';
import { BtnComponent } from '../../../ui/btn/btn';
import { TrackingWorkoutFacade } from './tracking-workout.facade';
import { StatusWorkoutSessionEnum } from '../../../../interfaces/tracking.interface';
import { IconComponent } from '../../../ui/icon/icon';
import { SpinnerComponent } from '../../../ui/icon/spinner';
import { CommonModule } from '@angular/common';
import { Loading } from '../../../ui/loading/loading';
import { switchAnimation } from '../../../../animations/animation';
import { DialogComponent } from '../../../ui/dialog/dialog';
import { WorkoutInProgress } from './workout-in-progress/workout-in-progress';
import { WorkoutCompleteList } from './workout-complete-list/workout-complete-list';
import { WorkoutEdition } from './workout-edition/workout-edition';
import { WorkoutRoutineSelector } from './workout-routine-selector/workout-routine-selector';
import { RoutineDay } from '../../../../interfaces/routines.interface';
import { trigger, transition, style, animate } from '@angular/animations';
import { WorkoutActionsMenu } from './workout-actions-menu/workout-actions-menu';

@Component({
    selector: 'app-tracking-workout',
    imports: [
        CommonModule,
        ExerciseSelector,
        BtnComponent,
        WorkoutInProgress,
        IconComponent,
        SpinnerComponent,
        Loading,
        DialogComponent,
        WorkoutCompleteList,
        WorkoutEdition,
        WorkoutRoutineSelector,
    ],
    providers: [TrackingWorkoutFacade],
    standalone: true,
    templateUrl: './tracking-workout.html',
    animations: [
        switchAnimation,
        trigger('dropdownAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
                animate(
                    '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    style({ opacity: 1, transform: 'translateY(0) scale(1)' }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    style({ opacity: 0, transform: 'translateY(-10px) scale(0.95)' }),
                ),
            ]),
        ]),
    ],
})
export class TrackingWorkoutComponent {
    facade = inject(TrackingWorkoutFacade);

    StatusWorkoutSessionEnum = StatusWorkoutSessionEnum;
    options = options;

    restMessages = [
        'Hoy no aceptamos estrés, solo sonrisas y buen rollo. ¡A disfrutar del día libre!',
        'Pausa el mundo un momento. Hoy te toca recargar energías',
        '¡Merecido descanso! Te lo has ganado',
        'Modo Relax: ¡Hoy no se ejercita!',
    ];

    randomRestMessage = this.restMessages[Math.floor(Math.random() * this.restMessages.length)];

    private elementRef = inject(ElementRef);
    isDialogOpen = signal(false);
    isRoutineDialogOpen = signal(false);
    isActionsOpen = signal(false);

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isActionsOpen.set(false);
        }
    }

    toggleActions() {
        this.isActionsOpen.update((v) => !v);
    }

    openDialog() {
        this.isDialogOpen.set(true);
        this.isActionsOpen.set(false);
    }

    closeDialog() {
        this.isDialogOpen.set(false);
    }

    openRoutineDialog() {
        this.isRoutineDialogOpen.set(true);
        this.isActionsOpen.set(false);
    }

    closeRoutineDialog() {
        this.isRoutineDialogOpen.set(false);
    }

    onRoutineSelected(routine: RoutineDay) {
        console.log('Rutina seleccionada:', routine);
        // Implement application of routine to workout session here in the future
        this.closeRoutineDialog();
    }

    startRoutineTracking() {
        this.facade.startRoutineTracking();
    }
}
