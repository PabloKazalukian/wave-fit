import { Component, Input } from '@angular/core';
import { COLOR_VALUES } from '../../../utils/color.type';
import { NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-text-link',
    standalone: true,
    imports: [RouterModule, NgClass],
    templateUrl: './text-link.html',
    styleUrl: './text-link.css',
})
export class TextLink {
    @Input() isExternal = false;
    @Input() text = '';
    @Input() routerLink = '';
    @Input() color: COLOR_VALUES = 'primary';

    warnBeforeLeaving(event: MouseEvent) {
        const confirmed = window.confirm('Estás por salir del sitio. ¿Continuar?');
        if (!confirmed) event.preventDefault();
    }
}
