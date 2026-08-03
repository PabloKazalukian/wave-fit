import { Component, computed, input, output } from '@angular/core';

@Component({
    selector: 'app-numeric-pagination',
    imports: [],
    templateUrl: './numeric-pagination.html',
    styles: ``,
})
export class NumericPagination {
    currentPage = input.required<number>();
    totalPages = input.required<number>();
    total = input<number>(0);
    limit = input<number>(0);

    pageChange = output<number>();

    hasPreviousPage = computed(() => this.currentPage() > 1);
    hasNextPage = computed(() => this.currentPage() < this.totalPages());

    startIndex = computed(() => (this.currentPage() - 1) * this.limit() + 1);
    endIndex = computed(() => Math.min(this.currentPage() * this.limit(), this.total()));

    visiblePages = computed(() => {
        const total = this.totalPages();
        const current = this.currentPage();
        const maxVisible = 5;

        if (total <= maxVisible) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        let start = Math.max(1, current - 2);
        const end = Math.min(total, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    });

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages()) {
            this.pageChange.emit(page);
        }
    }
}
