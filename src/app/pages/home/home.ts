import { Component } from '@angular/core';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { AuthService } from '../../core/services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.css',
    imports: [BtnComponent],
})
export class Home {
    constructor(private authSvc: AuthService, private router: Router) {}

    logout() {
        this.authSvc.logout();
        this.router.navigate(['/auth/login']);
    }
}
