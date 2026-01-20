import {
    Component,
    input,
    output,
    contentChild,
    TemplateRef,
    computed,
    signal,
    effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxComponent } from '../../checkbox/checkbox';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface TableColumn {
    key: string;
    label: string;
    sortable?: boolean;
    link?: (value: string) => string;
}

export interface SortEvent {
    column: string;
    isAscending: boolean;
}

@Component({
    selector: 'app-table',
    standalone: true,
    imports: [CommonModule, CheckboxComponent, ReactiveFormsModule],
    templateUrl: './table.html',
})
export class TableComponent {
    // Inputs
    data = input.required<any[]>();
    columns = input.required<TableColumn[]>();
    selectable = input<boolean>(false);

    // Template refs
    actionsTemplate = contentChild<TemplateRef<any>>('actions');
    selectionActions = contentChild<TemplateRef<any>>('selectionActions');

    // Outputs
    sortChange = output<SortEvent>();
    selectionChange = output<any[]>();

    // State signals
    private sortColumn = signal<string | null>(null);
    sortAscending = signal<boolean>(true);
    private selectedRows = signal<Set<any>>(new Set());
    openActionMenu = signal<string | null>(null);

    // Form Controls para los checkboxes
    headerCheckboxControl = new FormControl<boolean>(false, { nonNullable: true });
    rowCheckboxControls = new Map<any, FormControl<boolean>>();

    // Computed signals
    columnCount = computed(() => {
        let count = this.columns().length;
        if (this.selectable()) count++;
        if (this.actionsTemplate()) count++;
        return count;
    });

    selectedItems = computed(() => Array.from(this.selectedRows()));
    selectedCount = computed(() => this.selectedRows().size);

    allSelected = computed(() => {
        const dataLength = this.data().length;
        return dataLength > 0 && this.selectedRows().size === dataLength;
    });

    someSelected = computed(() => {
        const count = this.selectedRows().size;
        return count > 0 && count < this.data().length;
    });

    constructor() {
        // Effect para sincronizar el header checkbox con el estado de selección
        effect(() => {
            const all = this.allSelected();
            this.headerCheckboxControl.setValue(all, { emitEvent: false });
        });

        // Effect para actualizar los row controls cuando cambia la data
        effect(() => {
            const currentData = this.data();

            // Limpiar controles que ya no existen
            const currentRows = new Set(currentData);
            for (const [row, _] of this.rowCheckboxControls.entries()) {
                if (!currentRows.has(row)) {
                    this.rowCheckboxControls.delete(row);
                }
            }

            // Crear controles para nuevas filas
            currentData.forEach((row) => {
                if (!this.rowCheckboxControls.has(row)) {
                    const control = new FormControl<boolean>(false, { nonNullable: true });
                    this.rowCheckboxControls.set(row, control);

                    // Suscribirse a cambios del control
                    control.valueChanges.subscribe((checked) => {
                        this.handleRowCheckboxChange(row, checked);
                    });
                }
            });
        });

        // Suscribirse a cambios del header checkbox
        this.headerCheckboxControl.valueChanges.subscribe(() => {
            this.toggleSelectAll();
        });
    }

    // Methods
    getValue(row: any, key: string): any {
        return key.split('.').reduce((acc, part) => acc?.[part], row);
    }

    onSort(columnKey: string): void {
        if (this.sortColumn() === columnKey) {
            this.sortAscending.update((val) => !val);
        } else {
            this.sortColumn.set(columnKey);
            this.sortAscending.set(true);
        }

        this.sortChange.emit({
            column: columnKey,
            isAscending: this.sortAscending(),
        });
    }

    isColumnSorted(colKey: string): boolean {
        return this.sortColumn() === colKey;
    }

    getRowCheckboxControl(row: any): FormControl<boolean> {
        if (!this.rowCheckboxControls.has(row)) {
            const control = new FormControl<boolean>(false, { nonNullable: true });
            this.rowCheckboxControls.set(row, control);

            control.valueChanges.subscribe((checked) => {
                this.handleRowCheckboxChange(row, checked);
            });
        }
        return this.rowCheckboxControls.get(row)!;
    }

    private handleRowCheckboxChange(row: any, checked: boolean): void {
        const newSelection = new Set(this.selectedRows());

        if (checked) {
            newSelection.add(row);
        } else {
            newSelection.delete(row);
        }

        this.selectedRows.set(newSelection);
        this.selectionChange.emit(Array.from(newSelection));
    }

    toggleSelectAll(): void {
        const shouldSelectAll = !this.allSelected();

        if (shouldSelectAll) {
            this.selectedRows.set(new Set(this.data()));
            // Actualizar todos los row controls
            this.data().forEach((row) => {
                const control = this.getRowCheckboxControl(row);
                control.setValue(true, { emitEvent: false });
            });
        } else {
            this.selectedRows.set(new Set());
            // Desmarcar todos los row controls
            this.rowCheckboxControls.forEach((control) => {
                control.setValue(false, { emitEvent: false });
            });
        }

        this.selectionChange.emit(Array.from(this.selectedRows()));
    }

    isRowSelected(row: any): boolean {
        return this.selectedRows().has(row);
    }

    toggleActionMenu(rowId: string): void {
        if (this.openActionMenu() === rowId) {
            this.openActionMenu.set(null);
        } else {
            this.openActionMenu.set(rowId);
        }
    }

    closeActionMenu(): void {
        this.openActionMenu.set(null);
    }
}
