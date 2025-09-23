import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private storageKey = 'auth_user';
    private tokenKey = 'token';

    constructor(private http: HttpClient) { }

    login(username: string, password: string): boolean {
        // Simula validación contra una API
        if (username === 'admin' && password === '1234') {
            localStorage.setItem(this.storageKey, JSON.stringify({ username }));
            return true;
        }
        return false;
    }

    saveToken (token: string): boolean {
        if (token !== null && token.length > 0) {   
            localStorage.setItem(this.tokenKey, JSON.stringify( token ));
            return true;
        }
        return false;
    }

    logout(): void {
        localStorage.removeItem(this.storageKey);
    }

    isAuthenticated(): boolean {
        return localStorage.getItem(this.tokenKey) !== null;
    }

    getUser(): Observable<any> {
        //return JSON.parse(localStorage.getItem(this.storageKey) || 'null');
        return this.http.get('https://wavefit.test/sanctum/csrf-cookie').pipe(
            switchMap  (() => {
                return this.http.get('https://wavefit.test/api/user', {
                    headers: { Authorization: `Bearer ${localStorage.getItem(this.tokenKey)}` }
                })
                .pipe((data) => {
                    console.log(data);
                    return data;
                });
            })
        );
        }
    
}
