import { Component, OnInit } from '@angular/core';
import { BtnComponent } from '../../ui/btn/btn';
import { WaveLogoComponent } from '../../ui/logos/wave-logo/wave-logo';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-header',
    imports: [BtnComponent, WaveLogoComponent],
    standalone: true,
    templateUrl: './header.html',
    styleUrl: './header.css',
})
export class Header implements OnInit {
    show: boolean = true;

    constructor(private authSvc: AuthService, private router: Router) {}

    ngOnInit() {
        this.authSvc.isAuthenticated$.subscribe({
            next: (res) => {
                this.show = res;
            },
            error: (err) => {},
        });
    }

    logout() {
        this.authSvc.logout();
        this.router.navigate(['/auth/login']);
    }
}
