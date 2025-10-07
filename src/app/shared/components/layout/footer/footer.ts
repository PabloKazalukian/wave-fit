import { Component } from '@angular/core';
import { BtnComponent } from '../../ui/btn/btn';
import { TextLink } from '../../ui/text-link/text-link';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [TextLink],
    templateUrl: './footer.html',
    styleUrl: './footer.css',
})
export class Footer {}
