import { TestBed } from '@angular/core/testing';
import { decrypt, encrypt } from '../../../shared/utils/encryption.util';
import { CredentialsService } from './credentials.service';

describe('CredentialsService (TEST-002)', () => {
    let service: CredentialsService;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({ providers: [CredentialsService] });
        service = TestBed.inject(CredentialsService);
    });

    afterEach(() => localStorage.clear());

    it('stores the remember flag and obfuscates identifier/password', () => {
        service.saveCredentials({
            identifier: 'user@test.com',
            password: 'secret',
            remember: true,
        });

        expect(localStorage.getItem('remember')).toBe('true');
        expect(localStorage.getItem('identifier')).toBe(encrypt('user@test.com'));
        expect(localStorage.getItem('password')).not.toBe('secret');
        expect(decrypt(localStorage.getItem('password') as string)).toBe('secret');
    });

    it('restores the persisted credentials', () => {
        localStorage.setItem('remember', 'true');
        localStorage.setItem('identifier', encrypt('user@test.com'));
        localStorage.setItem('password', encrypt('secret'));

        expect(service.getCredentials()).toEqual({
            identifier: 'user@test.com',
            password: 'secret',
            remember: true,
        });
    });

    it('returns safe defaults when nothing is stored', () => {
        expect(service.getCredentials()).toEqual({
            identifier: '',
            password: '',
            remember: false,
        });
    });

    it('persists remember=false without dropping the identifier', () => {
        service.saveCredentials({
            identifier: 'user@test.com',
            password: 'secret',
            remember: false,
        });

        expect(localStorage.getItem('remember')).toBe('false');
        expect(service.getCredentials().remember).toBe(false);
        expect(service.getCredentials().identifier).toBe('user@test.com');
    });

    it('falls back to empty strings when stored values are corrupted', () => {
        localStorage.setItem('identifier', 'not-valid-base64!!!');
        localStorage.setItem('password', 'also-###invalid');

        expect(service.getCredentials()).toEqual({
            identifier: '',
            password: '',
            remember: false,
        });
    });

    it('removes every stored credential', () => {
        localStorage.setItem('remember', 'true');
        localStorage.setItem('identifier', encrypt('user@test.com'));
        localStorage.setItem('password', encrypt('secret'));

        service.removeCredentials();

        expect(localStorage.getItem('remember')).toBe('false');
        expect(localStorage.getItem('identifier')).toBeNull();
        expect(localStorage.getItem('password')).toBeNull();
        expect(service.getCredentials()).toEqual({
            identifier: '',
            password: '',
            remember: false,
        });
    });
});
