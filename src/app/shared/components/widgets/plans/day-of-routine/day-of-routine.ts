import { Component, input, OnChanges, effect, OnInit, SimpleChanges, signal } from '@angular/core';
import { DayPlan } from '../../../../interfaces/routines.interface';
import { RoutinesServices } from '../../../../../core/services/routines/routines.service';

@Component({
    selector: 'app-day-of-routine',
    imports: [],
    standalone: true,
    templateUrl: './day-of-routine.html',
    styles: ``,
})
export class DayOfRoutine {
    public dayPlan = input<DayPlan[]>();

    constructor(private routineSvc: RoutinesServices) {}

    // señal interna que siempre mantiene una copia del input

    // efecto 1: sincroniza el input con la señal local
    syncEffect = effect(() => {
        const value = this.dayPlan();
        console.log('valuarte', value);
    });
}
