import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-data-section',
    standalone: true,
    templateUrl: './data-section.html',
})
export class DataSection {
    @Input() title = '';
    @Input() data: any;

    open = true;

    toggle() {
        this.open = !this.open;
    }

    excludedKeys = new Set(['id', 'userId', 'updatedAt', 'createdAt']);

    get entries() {
        return this.data
            ? Object.entries(this.data).filter(
                  ([key]) => !this.excludedKeys.has(key)
              )
            : [];
    }

    isObject(value: any) {
        return typeof value === 'object' && value !== null;
    }

    isArray(value: any) {
        return Array.isArray(value);
    }

    formatKey(key: string) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, (x) => x.toUpperCase());
    }
}
