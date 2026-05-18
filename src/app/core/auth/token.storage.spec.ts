import { TestBed } from '@angular/core/testing';
import { TokenStorage } from './token.storage';
import { IndexedDbStorageService } from '../services/storage/indexed-db.service';

describe('TokenStorage', () => {
    let service: TokenStorage;
    let mockIndexedDb: any;

    beforeEach(() => {
        mockIndexedDb = {
            db: {
                authUser: {
                    get: jasmine.createSpy('get').and.returnValue(Promise.resolve(null)),
                    put: jasmine.createSpy('put').and.returnValue(Promise.resolve()),
                    delete: jasmine.createSpy('delete').and.returnValue(Promise.resolve()),
                },
            },
        };

        TestBed.configureTestingModule({
            providers: [
                TokenStorage,
                { provide: IndexedDbStorageService, useValue: mockIndexedDb },
            ],
        });

        service = TestBed.inject(TokenStorage);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('User operations', () => {
        const mockUser = { id: '1', name: 'Test', email: 'test@test.com', role: 'user' };

        it('should store and retrieve user', async () => {
            const authUser = { id: 'current', userId: mockUser.id, name: mockUser.name, email: mockUser.email, role: mockUser.role };
            mockIndexedDb.db.authUser.get.and.returnValue(Promise.resolve(authUser));

            await service.setUser(mockUser);
            expect(mockIndexedDb.db.authUser.put).toHaveBeenCalledWith(authUser);

            const result = await service.getUser();
            expect(result).toEqual(mockUser);
        });

        it('should return null if user does not exist', async () => {
            mockIndexedDb.db.authUser.get.and.returnValue(Promise.resolve(null));
            const result = await service.getUser();
            expect(result).toBeNull();
        });
    });

    describe('Clear operations', () => {
        it('should remove user from storage', async () => {
            await service.clear();
            expect(mockIndexedDb.db.authUser.delete).toHaveBeenCalledWith('current');
        });
    });
});
