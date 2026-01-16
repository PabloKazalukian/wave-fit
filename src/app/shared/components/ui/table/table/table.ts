import {
    Component,
    input,
    output,
    contentChild,
    TemplateRef,
    computed,
    signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

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
    imports: [CommonModule],
    templateUrl: './table.html',
    styles: [
        `
            .styled-table {
                border-collapse: collapse;
            }

            th,
            td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid var(--surface-3, #50c878);
            }

            thead {
                position: sticky;
                top: 0;
                z-index: 10;
            }

            tbody tr {
                transition: background-color 0.15s;
            }

            tbody tr:hover {
                background-color: var(--surface-1, #3ca15e);
            }

            tbody tr.selected {
                background-color: var(--primary-light, #3ca15e);
            }

            .sort-button {
                background: none;
                border: none;
                cursor: pointer;
                font-weight: inherit;
                font-size: inherit;
            }

            .arrow-icon {
                transition: all 0.2s;
            }

            .arrow-icon.active {
                color: var(--primary-color, #d99e1b);
                transform: scale(1.4);
                transition: all 0.6s;
            }

            .arrow-icon.inactive {
                color: var(--surface-4, #f5c623);
                opacity: 0.5;
            }

            .active-sort {
                color: var(--primary-color, #50c878);
            }
        `,
    ],
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

    toggleRowSelection(row: any): void {
        const newSelection = new Set(this.selectedRows());

        if (newSelection.has(row)) {
            newSelection.delete(row);
        } else {
            newSelection.add(row);
        }

        this.selectedRows.set(newSelection);
        this.selectionChange.emit(Array.from(newSelection));
    }

    toggleSelectAll(): void {
        if (this.allSelected()) {
            this.selectedRows.set(new Set());
        } else {
            this.selectedRows.set(new Set(this.data()));
        }
        this.selectionChange.emit(Array.from(this.selectedRows()));
    }

    isRowSelected(row: any): boolean {
        return this.selectedRows().has(row);
    }
}
