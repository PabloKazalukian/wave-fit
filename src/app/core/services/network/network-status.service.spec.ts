import { TestBed } from '@angular/core/testing';
import { NetworkStatusService } from './network-status.service';

describe('NetworkStatusService (TEST-001)', () => {
    let service: NetworkStatusService;
    let online: boolean;

    beforeEach(() => {
        online = true;
        spyOnProperty(navigator, 'onLine', 'get').and.callFake(() => online);

        TestBed.configureTestingModule({ providers: [NetworkStatusService] });
        service = TestBed.inject(NetworkStatusService);
    });

    it('initializes from navigator.onLine', () => {
        expect(service.isOnline()).toBe(true);
    });

    it('flips to offline when the offline event fires', () => {
        online = false;

        window.dispatchEvent(new Event('offline'));

        expect(service.isOnline()).toBe(false);
    });

    it('flips back online when the online event fires', () => {
        online = false;
        window.dispatchEvent(new Event('offline'));
        online = true;

        window.dispatchEvent(new Event('online'));

        expect(service.isOnline()).toBe(true);
    });

    it('removes its listeners on destroy', () => {
        const removeSpy = spyOn(window, 'removeEventListener');

        service.ngOnDestroy();

        expect(removeSpy).toHaveBeenCalledWith('online', jasmine.any(Function));
        expect(removeSpy).toHaveBeenCalledWith('offline', jasmine.any(Function));
    });
});
