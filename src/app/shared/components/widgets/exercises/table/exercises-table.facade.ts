import { Injectable, signal, computed } from '@angular/core';
import { Exercise } from '../../../../interfaces/exercise.interface';
// import { Exercise } from '../../shared/interfaces/exercise.interface';

export interface ExerciseTableRow {
    id: string;
    name: string;
    category: string;
}

export interface SortConfig {
    column: 'name' | 'category';
    isAscending: boolean;
}

@Injectable()
export class ExercisesTableFacade {
    // State signals
    private rawData = signal<ExerciseTableRow[]>([]);
    private filteredData = signal<ExerciseTableRow[]>([]);
    private pagedData = signal<ExerciseTableRow[]>([]);
    private selectedItems = signal<ExerciseTableRow[]>([]);
    private isLoading = signal<boolean>(false);

    // Public read-only signals
    readonly rawData$ = this.rawData.asReadonly();
    readonly filteredData$ = this.filteredData.asReadonly();
    readonly pagedData$ = this.pagedData.asReadonly();
    readonly selectedItems$ = this.selectedItems.asReadonly();
    readonly isLoading$ = this.isLoading.asReadonly();

    // Computed
    readonly hasData = computed(() => this.rawData().length > 0);
    readonly selectedCount = computed(() => this.selectedItems().length);

    // Table columns configuration
    readonly columns = signal([
        { key: 'name', label: 'Nombre del Ejercicio', sortable: true },
        { key: 'category', label: 'Categoría', sortable: true },
    ]);

    // Pagination config
    readonly pageSizeOptions = signal([10, 20, 50]);

    constructor() {}

    // ==================== DATA MANAGEMENT ====================

    setExercises(exercises: Exercise[]): void {
        const tableData = this.mapExercisesToTableRows(exercises);
        this.rawData.set(tableData);
        this.filteredData.set(tableData);
    }

    private mapExercisesToTableRows(exercises: Exercise[]): ExerciseTableRow[] {
        return exercises.map((exercise) => ({
            id: exercise.id || crypto.randomUUID(),
            name: exercise.name,
            category: this.formatCategory(exercise.category),
        }));
    }

    private formatCategory(category: string): string {
        const categoryMap: Record<string, string> = {
            SHOULDERS: 'Hombros',
            CHEST: 'Pecho',
            LEGS_FRONT: 'Piernas (Frontal)',
            LEGS_POSTERIOR: 'Piernas (Posterior)',
            LEGS: 'Piernas',
            BICEPS: 'Bíceps',
            TRICEPS: 'Tríceps',
            BACK: 'Espalda',
            CORE: 'Core/Abdomen',
        };

        return categoryMap[category] || category;
    }

    // ==================== FILTER ====================

    applyFilter(filteredData: ExerciseTableRow[]): void {
        this.filteredData.set(filteredData);
    }

    // ==================== SORT ====================

    applySort(sortConfig: SortConfig): void {
        const sorted = [...this.filteredData()].sort((a, b) => {
            const aVal = a[sortConfig.column];
            const bVal = b[sortConfig.column];

            const comparison = aVal.localeCompare(bVal, 'es', { sensitivity: 'base' });
            return sortConfig.isAscending ? comparison : -comparison;
        });

        this.filteredData.set(sorted);
    }

    // ==================== PAGINATION ====================

    updatePagedData(pagedData: ExerciseTableRow[]): void {
        this.pagedData.set(pagedData);
    }

    // ==================== SELECTION ====================

    updateSelection(items: ExerciseTableRow[]): void {
        this.selectedItems.set(items);
    }

    clearSelection(): void {
        this.selectedItems.set([]);
    }

    // ==================== ACTIONS ====================

    processSelectedExercises(): void {
        const selected = this.selectedItems();

        if (selected.length === 0) {
            console.warn('No hay ejercicios seleccionados');
            return;
        }

        console.log('Procesando ejercicios seleccionados:', selected);
        // Aquí puedes agregar lógica para:
        // - Agregar a una rutina
        // - Exportar ejercicios
        // - Eliminar ejercicios
        // - etc.
    }

    // ==================== LOADING ====================

    setLoading(loading: boolean): void {
        this.isLoading.set(loading);
    }
}
