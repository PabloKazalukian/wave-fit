import { Component, Input } from '@angular/core';
import { TranslateLabelPipe } from '../../../pipes/translate-label.pipe';

@Component({
    selector: 'app-data-section',
    standalone: true,
    imports: [TranslateLabelPipe],
    templateUrl: './data-section.html',
})
export class DataSection {
    @Input() title = '';
    @Input() data: any;

    open = false;

    toggle() {
        this.open = !this.open;
    }

    excludedKeys = new Set(['id', 'userId', 'updatedAt', 'createdAt']);

    get entries(): [string, unknown][] {
        return this.data ? Object.entries(this.data).filter(([key]) => !this.excludedKeys.has(key)) : [];
    }

    entriesOf(obj: unknown): [string, unknown][] {
        if (typeof obj !== 'object' || obj === null) return [];
        return Object.entries(obj).filter(([key]) => !this.excludedKeys.has(key));
    }

    arrayOf(value: unknown): unknown[] {
        return Array.isArray(value) ? value : [];
    }

    isObject(value: any) {
        return typeof value === 'object' && value !== null;
    }

    isArray(value: any) {
        return Array.isArray(value);
    }
}
