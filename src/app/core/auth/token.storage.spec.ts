import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token.storage';

describe('TokenStorage', () => {
    let service: TokenStorage;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [TokenStorage],
        });

        service = TestBed.inject(TokenStorage);
        localStorage.clear(); // Limpieza antes de cada test
    });

    afterEach(() => {
        localStorage.clear(); // Seguridad extra
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('Token operations', () => {
        it('should store and retrieve token', () => {
            service.setToken('abc123');
            expect(service.getToken()).toBe('abc123');
        });

        it('should return null if token does not exist', () => {
            expect(service.getToken()).toBeNull();
        });

        it('should return true when token exists', () => {
            service.setToken('abc123');
            expect(service.hasToken()).toBeTrue();
        });

        it('should return false when token does not exist', () => {
            expect(service.hasToken()).toBeFalse();
        });
    });

    describe('User operations', () => {
        const mockUser = { id: '1', email: 'test@test.com' };

        it('should store and retrieve user', () => {
            service.setUser(mockUser);
            expect(service.getUser()).toEqual(mockUser);
        });

        it('should return null if user does not exist', () => {
            expect(service.getUser()).toBeNull();
        });

        it('should return null if stored user JSON is invalid', () => {
            localStorage.setItem('auth_user', 'invalid_json');
            expect(service.getUser()).toBeNull();
        });
    });

    describe('Clear operations', () => {
        it('should remove token and user from storage', () => {
            service.setToken('abc123');
            service.setUser({ id: '1' });

            service.clear();

            expect(service.getToken()).toBeNull();
            expect(service.getUser()).toBeNull();
            expect(service.hasToken()).toBeFalse();
        });
    });
});
