import { Component, input } from '@angular/core';
import { LucideAngularModule, LucideIconData } from 'lucide-angular';

@Component({
    selector: 'app-info-card',
    imports: [LucideAngularModule],
    standalone: true,
    templateUrl: './info-card.html',
    styles: ``,
})
export class InfoCard {
    title = input<string>();
    description = input<string>();
    icon = input<LucideIconData>();
}
