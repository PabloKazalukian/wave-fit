import { Component, HostBinding, Input } from '@angular/core';

@Component({
    selector: 'app-icon',
    standalone: true,
    template: `<ng-content></ng-content>`,
})
export class IconComponent {
    @Input() size: 'sm' | 'md' = 'sm';
    @HostBinding('class') get classes() {
        return this.size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
    }
}
