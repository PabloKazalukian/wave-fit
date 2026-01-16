import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-table-filter',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './filter.html',
    styles: [
        `
            .filter-container {
                margin-bottom: 1rem;
            }
        `,
    ],
})
export class TableFilterComponent {
    label = input<string>('Buscar');
    placeholder = input<string>('Escribe para filtrar...');
    data = input.required<any[]>();
    columns = input.required<{ key: string }[]>();

    filteredData = output<any[]>();

    searchValue = signal<string>('');

    onSearchChange(value: string): void {
        const trimmedValue = value.trim().toLowerCase();

        if (!trimmedValue) {
            this.filteredData.emit(this.data());
            return;
        }

        const result = this.data().filter((row) =>
            this.columns().some((col) =>
                String(this.getValue(row, col.key)).toLowerCase().includes(trimmedValue),
            ),
        );

        this.filteredData.emit(result);
    }

    private getValue(row: any, key: string): any {
        return key.split('.').reduce((acc, part) => acc?.[part], row);
    }
}
