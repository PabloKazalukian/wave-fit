import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import { of } from 'rxjs';

import { Show } from './show';
import { TrackingAPI } from '../../../shared/interfaces/api/tracking-api.interface';

const buildWeek = (overrides: Partial<TrackingAPI> = {}): TrackingAPI => ({
    id: 'week-1',
    userId: 'u1',
    startDate: '2026-02-02T00:00:00.000Z',
    endDate: '2026-02-08T00:00:00.000Z',
    days: [],
    completed: false,
    active: false,
    ...overrides,
});

describe('Show', () => {
    let component: Show;
    let fixture: ComponentFixture<Show>;
    let apolloQuery: jasmine.Spy;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const queryFake =
        (findOne: Partial<TrackingAPI>) =>
        ({ query, variables }: any) => {
            const name = query?.definitions?.[0]?.name?.value;
            if (name === 'findOne')
                return of({ data: { findOne: buildWeek({ id: variables.id, ...findOne }) } });
            if (name === 'findAll') return of({ data: { findAll: [] } });
            return of({ data: null });
        };

    beforeEach(async () => {
        apolloQuery = jasmine.createSpy('query').and.callFake(queryFake({}));
        const apolloStub = {
            query: apolloQuery,
            mutate: jasmine.createSpy('mutate').and.returnValue(of({ data: null })),
            watchQuery: jasmine
                .createSpy('watchQuery')
                .and.returnValue({ valueChanges: of({ data: null }) }),
            subscribe: jasmine.createSpy('subscribe').and.returnValue(of({ data: null })),
        };

        await TestBed.configureTestingModule({
            imports: [Show],
            providers: [
                { provide: Apollo, useValue: apolloStub },
                provideRouter([{ path: 'trackings/:id', component: Show }]),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Show);
        component = fixture.componentInstance;
    });

    const mount = async () => {
        const router = TestBed.inject(Router);
        await router.navigate(['trackings', 'week-1']);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    };

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    it('shows the Activa badge when the week is active', async () => {
        apolloQuery.and.callFake(queryFake({ active: true }));

        await mount();

        const badge = qs('[data-test="week-status-badge"]');
        expect(badge).toBeTruthy();
        expect(badge!.textContent).toContain('Activa');
        expect(badge!.className).toContain('secondaryLight');
    });

    it('shows Completada/Incompleto instead of Activa for a non-active week', async () => {
        await mount();

        const badge = qs('[data-test="week-status-badge"]');
        expect(badge!.textContent).toContain('Incompleto');
        expect(badge!.className).not.toContain('secondaryLight');
    });
});
