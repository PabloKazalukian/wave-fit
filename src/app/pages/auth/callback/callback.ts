import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
    selector: 'app-callback',
    imports: [],
    standalone: true,
    templateUrl: './callback.html',
    styleUrl: './callback.css',
})
export class Callback implements OnInit {
    constructor(private router: ActivatedRoute, private authSvc: AuthService) {}

    ngOnInit(): void {
        this.router.queryParams.subscribe((params) => {
            console.log(params);
            const token = params['token'];
            console.log(token);
            if (token !== null) {
                this.authSvc.saveToken(token);
            }
        });

        // this.authSvc.getUser().subscribe((user) => {
        //     console.log(user);
        // });
        /* this.http.get('http://localhost:8000/api/protected', {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
      });
      */
    }
}
