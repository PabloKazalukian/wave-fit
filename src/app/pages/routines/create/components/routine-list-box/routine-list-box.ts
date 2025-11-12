// routine-list-box.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RoutineSummary } from '../../../../../shared/interfaces/routines.interface';

@Component({
    selector: 'app-routine-list-box',
    standalone: true,
    template: `
        <ul role="listbox" tabindex="0" class="listbox">
            @for (item of items; track item.id) {
            <li
                role="option"
                (click)="pickId(item.id)"
                (keydown.enter)="pickId(item.id)"
                tabindex="0"
                [attr.aria-selected]="item.id === selected"
            >
                <div class="title">{{ item.title }}</div>
                <div class="meta">{{ item.durationMinutes }} min • {{ item.difficulty }}</div>
            </li>
            }
        </ul>
    `,
    styles: [
        `
            .listbox {
                max-height: 160px;
                overflow: auto;
                padding: 4px;
                border-radius: 8px;
            }
            li {
                padding: 8px;
                border-radius: 6px;
                cursor: pointer;
            }
            li:hover,
            li:focus {
                background: rgba(0, 0, 0, 0.04);
                outline: none;
            }
            .title {
                font-weight: 600;
            }
            .meta {
                font-size: 0.85rem;
                opacity: 0.8;
            }
        `,
    ],
})
export class RoutineListBoxComponent {
    @Input() items: RoutineSummary[] = [];
    @Output() pick = new EventEmitter<string>();
    selected?: string;
    pickId(id: string) {
        this.selected = id;
        this.pick.emit(id);
    }
}
