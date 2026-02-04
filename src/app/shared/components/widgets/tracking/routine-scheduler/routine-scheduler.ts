import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardAddExtra } from './card-add-extra/card-add-extra';
import { CardExtraExercise } from './card-extra-exercise/card-extra-exercise';

// interface Exercise {
//     id: string;
//     name: string;
//     description: string;
//     time: number | null;
//     showInput: boolean;
// }

export interface Exercise {
    id: string;
    name: string;
    description: string;
    time: number | null;
    showInput: boolean;
    showDeleteButton: boolean; // 👈 Nueva propiedad
}

interface Day {
    number: number;
    label: string;
}

@Component({
    selector: 'app-routine-scheduler',
    standalone: true,
    imports: [CommonModule, FormsModule, CardAddExtra, CardExtraExercise],
    templateUrl: './routine-scheduler.html',
})
export class RoutineSchedulerComponent {
    startDate = '15 Sep, 2025';
    totalDays = 7;
    visibleDayCount = 4;
    currentDayIndex = 0;
    selectedDay = signal<number>(1);

    exercises: { [key: number]: Exercise[] } = {
        1: [
            {
                id: '1',
                name: 'Yoga Matutino',
                description: 'Sesión de yoga suave para empezar el día',
                time: 30,
                showInput: false,
                showDeleteButton: true, // 👈 Agregar
            },
            // ... resto
        ],
    };

    get allDays(): Day[] {
        const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        return Array.from({ length: this.totalDays }, (_, i) => ({
            number: i + 1,
            label: dayLabels[i % 7],
        }));
    }

    get visibleDays(): Day[] {
        return this.allDays.slice(
            this.currentDayIndex,
            this.currentDayIndex + this.visibleDayCount,
        );
    }

    previousDays(): void {
        if (this.currentDayIndex > 0) {
            this.currentDayIndex--;
        }
    }

    nextDays(): void {
        if (this.currentDayIndex < this.totalDays - this.visibleDayCount) {
            this.currentDayIndex++;
        }
    }

    selectDay(dayNumber: number): void {
        this.selectedDay.set(dayNumber);
    }

    getDayClasses(dayNumber: number): string {
        const isSelected = this.selectedDay() === dayNumber;
        return isSelected
            ? 'bg-primary text-background'
            : 'border border-primary bg-background2 text-primary hover:bg-primary/10';
    }

    getDayName(dayNumber: number): string {
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        return dayNames[(dayNumber - 1) % 7];
    }

    getDayExercises(dayNumber: number): Exercise[] {
        return this.exercises[dayNumber] || [];
    }

    getTotalTime(dayNumber: number): number {
        const exercises = this.getDayExercises(dayNumber);
        return exercises.reduce((total, ex) => total + (ex.time || 0), 0);
    }

    toggleExerciseInput(exercise: Exercise): void {
        console.log(exercise);
        if (exercise.showInput) {
            // Está guardando
            exercise.showInput = false;
            exercise.showDeleteButton = true; // 👈 Mostrar botón X
        } else {
            // Está editando
            exercise.showInput = true;
            exercise.showDeleteButton = false; // 👈 Ocultar botón X
        }
    }

    deleteExercise(exercise: Exercise): void {
        // event.stopPropagation(); // Evitar que dispare otros clicks

        const currentDay = this.selectedDay();
        if (currentDay === null) return;

        const dayExercises = this.exercises[currentDay];
        const index = dayExercises.findIndex((ex) => ex.id === exercise.id);

        if (index !== -1) {
            dayExercises.splice(index, 1);
        }
    }

    addNewExercise(name: string): void {
        const currentDay = this.selectedDay();
        if (currentDay === null) return;

        const newExercise: Exercise = {
            id: Date.now().toString(),
            name: name,
            description: 'Descripción del ejercicio',
            time: null,
            showInput: true,
            showDeleteButton: false, // 👈 Inicializar
        };

        if (!this.exercises[currentDay]) {
            this.exercises[currentDay] = [];
        }
        this.exercises[currentDay].push(newExercise);
    }
}
