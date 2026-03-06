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
        it('should remove user from storage', () => {
            service.setUser({ id: '1' });

            service.clear();

            expect(service.getUser()).toBeNull();
        });
    });
});
