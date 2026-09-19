import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './services/auth/auth.service';
import { authGuard, guestGuard } from './auth-guard';

describe('auth-guard (TEST-004)', () => {
    let auth: { hasSession: jasmine.Spy };
    let router: { parseUrl: jasmine.Spy };
    const loginTree = { path: '/auth/login' } as unknown as UrlTree;
    const homeTree = { path: '/home' } as unknown as UrlTree;

    beforeEach(() => {
        auth = { hasSession: jasmine.createSpy('hasSession').and.returnValue(false) };
        router = {
            parseUrl: jasmine
                .createSpy('parseUrl')
                .and.callFake((url: string) => (url === '/home' ? homeTree : loginTree)),
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
            ],
        });
    });

    const run = (guard: CanActivateFn) =>
        TestBed.runInInjectionContext(() => guard({} as never, {} as never));

    describe('authGuard', () => {
        it('allows activation when a session exists', () => {
            auth.hasSession.and.returnValue(true);

            expect(run(authGuard)).toBe(true);
            expect(router.parseUrl).not.toHaveBeenCalled();
        });

        it('redirects to /auth/login when unauthenticated', () => {
            expect(run(authGuard)).toBe(loginTree);
            expect(router.parseUrl).toHaveBeenCalledWith('/auth/login');
        });
    });

    describe('guestGuard', () => {
        it('allows activation when there is no session', () => {
            expect(run(guestGuard)).toBe(true);
            expect(router.parseUrl).not.toHaveBeenCalled();
        });

        it('redirects to /home when a session already exists', () => {
            auth.hasSession.and.returnValue(true);

            expect(run(guestGuard)).toBe(homeTree);
            expect(router.parseUrl).toHaveBeenCalledWith('/home');
        });
    });
});
