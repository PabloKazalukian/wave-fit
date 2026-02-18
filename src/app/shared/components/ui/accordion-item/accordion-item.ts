import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'app-accordion-item',
    standalone: true,
    templateUrl: './accordion-item.html',
    styles: ``,
})
export class AccordionItemComponent {
    @Input() title!: string;
    @Input() open = false;
    @Input() isSelected = false;
    @Input() isError = false;
    @Input() draggable = false;

    @Output() toggle = new EventEmitter<void>();

    onToggle() {
        this.toggle.emit();
    }
}
