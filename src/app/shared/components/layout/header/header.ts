import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../ui/btn/btn';
import { WaveLogoComponent } from '../../ui/logos/wave-logo/wave-logo';
import { AuthService } from '../../../../core/services/auth/auth.service';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
    selector: 'app-header',
    imports: [BtnComponent, WaveLogoComponent, CommonModule, RouterModule],
    standalone: true,
    templateUrl: './header.html',
    styleUrl: './header.css',
})
export class Header implements OnInit {
    show = true;
    isMobileMenuOpen = signal(false);
    isRoutinesDropdownOpen = signal(false);
    isUserDropdownOpen = signal(false);

    private readonly authSvc = inject(AuthService);
    private readonly router = inject(Router);
    private readonly destroyRef = inject(DestroyRef);

    user = this.authSvc.user;
    userName = computed(() => this.user()?.name || 'Usuario');
    currentUrl = signal(this.router.url);

    ngOnInit() {
        this.authSvc.isAuthenticated$.subscribe({
            next: (res) => {
                this.show = res;
            },
        });

        this.router.events
            .pipe(
                filter((event) => event instanceof NavigationEnd),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe((event: NavigationEnd) => {
                this.currentUrl.set(event.urlAfterRedirects);
            });
    }

    isActive(path: string): boolean {
        return this.currentUrl().startsWith(path);
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen.update((val) => !val);
    }

    toggleRoutinesDropdown(event: Event) {
        event.stopPropagation();
        this.isRoutinesDropdownOpen.update((val) => !val);
        this.isUserDropdownOpen.set(false);
    }

    toggleUserDropdown(event: Event) {
        event.stopPropagation();
        this.isUserDropdownOpen.update((val) => !val);
        this.isRoutinesDropdownOpen.set(false);
    }

    closeDropdowns() {
        this.isRoutinesDropdownOpen.set(false);
        this.isUserDropdownOpen.set(false);
    }

    logout() {
        this.authSvc.logout();
        this.router.navigate(['/auth/login']);
    }

    goToHome() {
        this.router.navigate(['/home']);
        this.isMobileMenuOpen.set(false);
    }
}
