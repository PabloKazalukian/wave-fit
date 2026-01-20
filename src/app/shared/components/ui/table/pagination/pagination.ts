import { Component, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-table-pagination',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './pagination.html',
    styles: [
        `
            .pagination-container {
                border-top: 1px solid var(--border-color, #e5e7eb);
            }

            .active {
                font-weight: 600;
            }
        `,
    ],
})
export class TablePaginationComponent {
    data = input.required<any[]>();
    pageSizeOptions = input<number[]>([10, 20, 50, 100]);

    pageData = output<any[]>();
    pageSizeChange = output<number>();

    currentPage = signal<number>(0);
    pageSize = signal<number>(10);

    // Computed values
    totalItems = computed(() => this.data().length);
    totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));
    startIndex = computed(() => this.currentPage() * this.pageSize());
    endIndex = computed(() => Math.min(this.startIndex() + this.pageSize(), this.totalItems()));

    hasPreviousPage = computed(() => this.currentPage() > 0);
    hasNextPage = computed(() => this.currentPage() < this.totalPages() - 1);

    visiblePages = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const maxVisible = 5;

        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i);
        }

        let start = Math.max(0, current - 2);
        let end = Math.min(total, start + maxVisible);

        if (end - start < maxVisible) {
            start = Math.max(0, end - maxVisible);
        }

        return Array.from({ length: end - start }, (_, i) => start + i);
    });

    constructor() {
        // Auto-emit cuando cambia la data o paginación
        effect(() => {
            this.emitPageData();
        });
    }

    emitPageData(): void {
        const start = this.startIndex();
        const end = this.endIndex();
        this.pageData.emit(this.data().slice(start, end));
    }

    goToPage(page: number): void {
        if (page >= 0 && page < this.totalPages()) {
            this.currentPage.set(page);
        }
    }

    previousPage(): void {
        if (this.hasPreviousPage()) {
            this.currentPage.update((p) => p - 1);
        }
    }

    nextPage(): void {
        if (this.hasNextPage()) {
            this.currentPage.update((p) => p + 1);
        }
    }

    onPageSizeChange(event: Event): void {
        const newSize = Number((event.target as HTMLSelectElement).value);
        this.pageSize.set(newSize);
        this.currentPage.set(0); // Reset a primera página
        this.pageSizeChange.emit(newSize);
    }
}
