import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExercisesTableFacade, ExerciseTableRow } from './exercises-table.facade';
import { TableComponent } from '../../../ui/table/table/table';
import { TableFilterComponent } from '../../../ui/table/filter/filter';
import { TablePaginationComponent } from '../../../ui/table/pagination/pagination';
import { Exercise } from '../../../../interfaces/exercise.interface';
import { ExercisesService } from '../../../../../core/services/exercises/exercises.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-exercises-table',
    standalone: true,
    imports: [CommonModule, TableComponent, TableFilterComponent, TablePaginationComponent],
    providers: [ExercisesTableFacade],
    templateUrl: './exercises-table.html',
    styles: [
        `
            .exercises-table-container {
                width: 100%;
            }

            .loading-state,
            .empty-state {
                min-height: 300px;
            }
        `,
    ],
})
export class ExercisesTableComponent implements OnInit {
    // Input desde el componente padre
    private destroyRef = inject(DestroyRef);
    exercises = signal<Exercise[]>([]);
    enableSelection = input<boolean>(true);

    constructor(
        public facade: ExercisesTableFacade,
        private exerciseSvc: ExercisesService,
    ) {}

    ngOnInit(): void {
        this.exerciseSvc
            .getExercises()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (data) => {
                    if (data!) this.exercises.set(data);
                    this.facade.setExercises(this.exercises());
                },
                error: (err) => {},
            });
    }

    // ==================== EVENT HANDLERS ====================

    onFilteredData(data: ExerciseTableRow[]): void {
        this.facade.applyFilter(data);
    }

    onPageData(data: ExerciseTableRow[]): void {
        this.facade.updatePagedData(data);
    }

    onSort(event: { column: string; isAscending: boolean }): void {
        this.facade.applySort({
            column: event.column as 'name' | 'category',
            isAscending: event.isAscending,
        });
    }

    onSelectionChange(items: ExerciseTableRow[]): void {
        this.facade.updateSelection(items);
    }
}
