import { Component } from '@angular/core';
import { BtnComponent } from '../../../shared/components/ui/btn/btn';
import { WaveLogoTextComponent } from '../../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { WeeklyTrackings } from '../../../shared/components/widgets/users/weekly-trackings/weekly-trackings';

@Component({
    selector: 'app-success',
    imports: [BtnComponent, WaveLogoTextComponent, WeeklyTrackings],
    standalone: true,
    templateUrl: './success.html',
    styles: ``,
})
export class Success {}
