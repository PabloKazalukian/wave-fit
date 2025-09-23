import { Component, Input } from '@angular/core';
import { COLOR_VALUES } from '../../../utils/color.type';
import { NgClass } from '@angular/common';

@Component({
    selector: 'app-loading',
    imports: [NgClass],
    standalone: true,
    templateUrl: './loading.html',
    styleUrl: './loading.css',
})
export class Loading {
    @Input() color: COLOR_VALUES = 'primary';

    constructor() {}
}
