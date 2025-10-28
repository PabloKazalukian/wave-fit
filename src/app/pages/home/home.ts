import { Component } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';
import { WaveLogoComponent } from '../../shared/components/ui/logos/wave-logo/wave-logo';
import { WaveLogoTextComponent } from '../../shared/components/ui/logos/wave-logo-text/wave-logo-text';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.css',
    imports: [WaveLogoTextComponent],
})
export class Home {}
