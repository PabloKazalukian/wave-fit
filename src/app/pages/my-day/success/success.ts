import { Component } from '@angular/core';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';

@Component({
    selector: 'app-success',
    imports: [BtnComponent, WaveLogoTextComponent],
    standalone: true,
    templateUrl: './success.html',
    styles: ``,
})
export class Success {}
