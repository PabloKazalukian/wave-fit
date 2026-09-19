import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { of, throwError } from 'rxjs';
import { User } from '../../../shared/interfaces/token.interface';
import { TokenStorage } from '../../auth/token.storage';
import { AuthService } from './auth.service';

describe('AuthService (TEST-003)', () => {
    let service: AuthService;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };
    let tokenStorage: {
        getUser: jasmine.Spy;
        setUser: jasmine.Spy;
        clear: jasmine.Spy;
    };
    let router: { navigate: jasmine.Spy };

    const buildUser = (overrides: Partial<User> = {}): User => ({
        id: 'user-1',
        name: 'Ada',
        email: 'ada@test.com',
        avatar: { url: 'https://cdn.test/ada.png' },
        role: 'user',
        ...overrides,
    });

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('apollo.query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('apollo.mutate').and.returnValue(of({ data: null })),
        };
        tokenStorage = {
            getUser: jasmine.createSpy('tokenStorage.getUser').and.resolveTo(null),
            setUser: jasmine.createSpy('tokenStorage.setUser').and.resolveTo(undefined),
            clear: jasmine.createSpy('tokenStorage.clear').and.resolveTo(undefined),
        };
        router = { navigate: jasmine.createSpy('router.navigate') };
        spyOn(console, 'error');
        spyOn(console, 'warn');

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                { provide: Apollo, useValue: apollo },
                { provide: TokenStorage, useValue: tokenStorage },
                { provide: Router, useValue: router },
            ],
        });

        service = TestBed.inject(AuthService);
    });

    describe('initial state', () => {
        it('starts unauthenticated with no user', () => {
            expect(service.user()).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
            expect(service.hasSession()).toBe(false);
            expect(service.avatarUrl()).toBeUndefined();
        });
    });

    describe('initializeUserFromStorage', () => {
        it('restores a stored user and emits the session', fakeAsync(() => {
            const stored = buildUser();
            tokenStorage.getUser.and.resolveTo(stored);
            const sessionFlags: boolean[] = [];
            const userIds: (string | null)[] = [];
            service.isAuthenticated$.subscribe((v) => sessionFlags.push(v));
            service.user$.subscribe((v) => userIds.push(v));

            service.initializeUserFromStorage();
            flushMicrotasks();

            expect(service.user()).toEqual(stored);
            expect(service.hasSession()).toBe(true);
            expect(sessionFlags).toEqual([false, true]);
            expect(userIds).toEqual([null, 'user-1']);
        }));

        it('keeps the anonymous state when storage is empty', fakeAsync(() => {
            service.initializeUserFromStorage();
            flushMicrotasks();

            expect(service.user()).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
        }));
    });

    describe('me()', () => {
        it('hydrates the session and persists the user', fakeAsync(() => {
            const user = buildUser();
            apollo.query.and.returnValue(of({ data: { me: user } }));
            let result: User | null | undefined;

            service.me().subscribe((res) => (result = res));
            flushMicrotasks();

            expect(result).toEqual(user);
            expect(service.user()).toEqual(user);
            expect(service.isAuthenticated()).toBe(true);
            expect(service.avatarUrl()).toBe(user.avatar?.url);
            expect(tokenStorage.setUser).toHaveBeenCalledWith(user);
        }));

        it('clears the session when the API returns no user', fakeAsync(() => {
            apollo.query.and.returnValue(of({ data: { me: null } }));

            service.me().subscribe();
            flushMicrotasks();

            expect(service.user()).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
            expect(tokenStorage.setUser).toHaveBeenCalledWith(null);
        }));

        it('logs out and rethrows on an explicit UNAUTHENTICATED error', fakeAsync(() => {
            service.user.set(buildUser());
            apollo.query.and.returnValue(
                throwError(() => ({
                    graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }],
                })),
            );
            let errored = false;

            service.me().subscribe({ error: () => (errored = true) });
            flushMicrotasks();

            expect(errored).toBe(true);
            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(service.user()).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
        }));

        it('keeps the offline session on a network/timeout error', fakeAsync(() => {
            const user = buildUser();
            service.user.set(user);
            apollo.query.and.returnValue(throwError(() => new Error('Network error')));
            let result: User | null | undefined;

            service.me().subscribe((res) => (result = res));
            flushMicrotasks();

            expect(result).toEqual(user);
            expect(service.user()).toEqual(user);
            expect(tokenStorage.clear).not.toHaveBeenCalled();
        }));
    });

    describe('login()', () => {
        it('returns true and loads the profile on success', fakeAsync(() => {
            const user = buildUser();
            apollo.mutate.and.returnValue(of({ data: { login: true } }));
            apollo.query.and.returnValue(of({ data: { me: user } }));
            let result: boolean | undefined;

            service.login('ada@test.com', 'secret').subscribe((res) => (result = res));
            flushMicrotasks();

            expect(result).toBe(true);
            expect(apollo.mutate).toHaveBeenCalled();
            expect(apollo.query).toHaveBeenCalled();
            expect(service.user()).toEqual(user);
        }));

        it('returns false without querying me() when the mutation fails', () => {
            apollo.mutate.and.returnValue(of({ data: { login: false } }));
            let result: boolean | undefined;

            service.login('ada@test.com', 'wrong').subscribe((res) => (result = res));

            expect(result).toBe(false);
            expect(apollo.query).not.toHaveBeenCalled();
            expect(service.isAuthenticated()).toBe(false);
        });

        it('returns false when the mutation errors', () => {
            apollo.mutate.and.returnValue(throwError(() => new Error('boom')));
            let result: boolean | undefined;

            service.login('ada@test.com', 'secret').subscribe((res) => (result = res));

            expect(result).toBe(false);
        });
    });

    describe('logout()', () => {
        it('clears the session and redirects to login', fakeAsync(() => {
            service.user.set(buildUser());
            apollo.mutate.and.returnValue(of({ data: { logout: true } }));

            service.logout();
            flushMicrotasks();

            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(service.user()).toBeNull();
            expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        }));

        it('clears the session and redirects even when the mutation errors', fakeAsync(() => {
            apollo.mutate.and.returnValue(throwError(() => new Error('boom')));

            service.logout();
            flushMicrotasks();

            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
        }));
    });

    describe('clearSession', () => {
        it('wipes storage and resets the session flags', fakeAsync(() => {
            service.user.set(buildUser());
            service.isAuthenticated$.subscribe();

            service.clearSession();
            flushMicrotasks();

            expect(tokenStorage.clear).toHaveBeenCalled();
            expect(service.user()).toBeNull();
            expect(service.isAuthenticated()).toBe(false);
        }));
    });

    describe('updateAvatar', () => {
        it('updates the user signal and persists the new avatar', () => {
            const updated = buildUser({ avatar: { url: 'https://cdn.test/new.png' } });
            apollo.mutate.and.returnValue(of({ data: { updateAvatar: updated } }));
            let result: User | null | undefined;

            service.updateAvatar('base64').subscribe((res) => (result = res));

            expect(result).toEqual(updated);
            expect(service.user()).toEqual(updated);
            expect(service.avatarUrl()).toBe('https://cdn.test/new.png');
            expect(tokenStorage.setUser).toHaveBeenCalledWith(updated);
        });
    });

    describe('loginWithGoogle()', () => {
        it('hydrates the session from the OAuth payload', fakeAsync(() => {
            const user = buildUser();
            apollo.mutate.and.returnValue(of({ data: { loginWithGoogle: { user } } }));

            service.loginWithGoogle('code', 'verifier').subscribe();
            flushMicrotasks();

            expect(service.user() as User).toEqual(user);
            expect(service.isAuthenticated()).toBe(true);
            expect(tokenStorage.setUser).toHaveBeenCalledWith(user);
        }));
    });

    describe('register() / isEmailAvailable()', () => {
        it('returns true after a successful registration', () => {
            apollo.mutate.and.returnValue(of({ data: { createUser: { id: '1' } } }));
            let result: boolean | undefined;

            service.register('Ada', 'ada@test.com', 'secret').subscribe((res) => (result = res));

            expect(result).toBe(true);
        });

        it('returns false when registration errors', () => {
            apollo.mutate.and.returnValue(throwError(() => ({ graphQLErrors: [] })));
            let result: boolean | undefined;

            service.register('Ada', 'ada@test.com', 'secret').subscribe((res) => (result = res));

            expect(result).toBe(false);
        });

        it('exposes email availability', () => {
            apollo.query.and.returnValue(of({ data: { isEmailAvailable: false } }));
            let result: boolean | undefined;

            service.isEmailAvailable('ada@test.com').subscribe((res) => (result = res));

            expect(result).toBe(false);
            expect(apollo.query).toHaveBeenCalled();
        });
    });
});
