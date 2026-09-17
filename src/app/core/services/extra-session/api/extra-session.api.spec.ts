import { TestBed } from '@angular/core/testing';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../shared/interfaces/extra-session.interface';
import { AuthService } from '../../auth/auth.service';
import { ExtraSessionApi } from './extra-session.api';

describe('ExtraSessionApi', () => {
    let service: ExtraSessionApi;
    let apollo: { query: jasmine.Spy; mutate: jasmine.Spy };

    const catalog: ExtraSessionDisciplineConfig[] = [
        { key: 'run', label: 'Running', category: ExtraSessionCategory.CARDIO, met: 9.8 },
    ];

    const session: ExtraSession = {
        id: 'x-1',
        userId: 'user-1',
        category: ExtraSessionCategory.CARDIO,
        discipline: 'Running',
        date: '2026-05-01',
        duration: 30,
        intensityLevel: 3,
    };

    beforeEach(() => {
        apollo = {
            query: jasmine.createSpy('query').and.returnValue(of({ data: null })),
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
        };

        TestBed.configureTestingModule({
            providers: [
                ExtraSessionApi,
                { provide: Apollo, useValue: apollo },
                { provide: AuthService, useValue: { logout: jasmine.createSpy('logout') } },
            ],
        });

        service = TestBed.inject(ExtraSessionApi);
    });

    it('getCatalog maps extraSessionCatalog and uses cache-first', () => {
        apollo.query.and.returnValue(of({ data: { extraSessionCatalog: catalog } }));

        let result: ExtraSessionDisciplineConfig[] | undefined;
        service.getCatalog().subscribe((res) => (result = res));

        const args = apollo.query.calls.mostRecent().args[0];
        expect(args.fetchPolicy).toBe('cache-first');
        expect(result).toEqual(catalog);
    });

    it('getCatalog falls back to an empty array when data is missing', () => {
        let result: ExtraSessionDisciplineConfig[] | undefined;
        service.getCatalog().subscribe((res) => (result = res));

        expect(result).toEqual([]);
    });

    it('getByWorkoutSession queries network-only with the workoutSessionId', () => {
        apollo.query.and.returnValue(of({ data: { extraSessionsByWorkoutSession: [session] } }));

        let result: ExtraSession[] | undefined;
        service.getByWorkoutSession('ws-1').subscribe((res) => (result = res));

        const args = apollo.query.calls.mostRecent().args[0];
        expect(args.variables).toEqual({ workoutSessionId: 'ws-1' });
        expect(args.fetchPolicy).toBe('network-only');
        expect(result).toEqual([session]);
    });

    it('getByIds queries network-only with the ids', () => {
        apollo.query.and.returnValue(of({ data: { extraSessionsByIds: [session] } }));

        let result: ExtraSession[] | undefined;
        service.getByIds(['x-1']).subscribe((res) => (result = res));

        const args = apollo.query.calls.mostRecent().args[0];
        expect(args.variables).toEqual({ ids: ['x-1'] });
        expect(args.fetchPolicy).toBe('network-only');
        expect(result).toEqual([session]);
    });

    it('getByIds falls back to an empty array when data is missing', () => {
        let result: ExtraSession[] | undefined;
        service.getByIds(['x-1']).subscribe((res) => (result = res));

        expect(result).toEqual([]);
    });

    it('update sends updateExtraSessionInput and returns the session', () => {
        const input = { id: 'x-1', duration: 60 };
        apollo.mutate.and.returnValue(of({ data: { updateExtraSession: session } }));

        let result: ExtraSession | undefined;
        service.update(input).subscribe((res) => (result = res));

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.variables).toEqual({ updateExtraSessionInput: input });
        expect(result).toEqual(session);
    });

    it('remove sends the id and returns the boolean result', () => {
        apollo.mutate.and.returnValue(of({ data: { removeExtraSession: true } }));

        let result: boolean | undefined;
        service.remove('x-1').subscribe((res) => (result = res));

        const args = apollo.mutate.calls.mostRecent().args[0];
        expect(args.variables).toEqual({ id: 'x-1' });
        expect(result).toBe(true);
    });
});
