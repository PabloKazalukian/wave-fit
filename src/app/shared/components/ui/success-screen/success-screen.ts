import { Component, input, Input } from '@angular/core';

@Component({
    selector: 'app-success-screen',
    standalone: true,
    styleUrls: ['./success-screen.css'],
    templateUrl: './success-screen.html',
    styles: ``,
})
export class SuccessScreen {
    title = input<string>('');
    description = input<string>('');
}
