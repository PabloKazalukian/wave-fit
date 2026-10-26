import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DayDeferred } from './day-deferred';
import { PlanDayService } from '../../../../core/services/day-logs/plan-day.service';
import { DayLogVM } from '../../../../shared/interfaces/day-log.interface';
import { ExerciseCategory } from '../../../../shared/interfaces/exercise.interface';

describe('DayDeferred', () => {
    let fixture: ComponentFixture<DayDeferred>;
    let planDaySvc: jasmine.SpyObj<PlanDayService>;

    const qs = (selector: string): HTMLElement | null =>
        fixture.nativeElement.querySelector(selector);

    const dayLog: DayLogVM = {
        id: 'day-1',
        userId: 'user-1',
        date: '2026-10-15',
        exercises: [
            {
                exerciseId: 'ex-1',
                name: 'Press banca',
                series: 3,
                category: ExerciseCategory.CHEST,
                sets: [{ reps: 10, weights: 50 }],
                usesWeight: true,
            },
        ],
        extraSessionIds: [],
        status: 'pending',
        active: false,
        completed: false,
        notes: 'Nota',
    };

    const setup = async (query: Record<string, string>) => {
        await TestBed.configureTestingModule({
            imports: [DayDeferred],
            providers: [
                provideRouter([]),
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: { queryParamMap: convertToParamMap(query) },
                    },
                },
                { provide: PlanDayService, useValue: planDaySvc },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(DayDeferred);
        fixture.detectChanges();
    };

    beforeEach(() => {
        planDaySvc = jasmine.createSpyObj('PlanDayService', ['findById']);
    });

    it('loads the day-log by id and renders the demo labels', async () => {
        planDaySvc.findById.and.returnValue(of(dayLog));

        await setup({ date: '2026-10-15', id: 'day-1' });

        expect(planDaySvc.findById).toHaveBeenCalledWith('day-1');
        expect((qs('#deferred-date') as HTMLInputElement).value).toBe('15-10-2026');
        expect((qs('#deferred-status') as HTMLInputElement).value).toBe('Pendiente');
        expect((qs('#deferred-notes') as HTMLTextAreaElement).value).toBe('Nota');
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain('Press banca');
    });

    it('renders the date-only demo form when only date is provided', async () => {
        await setup({ date: '2026-10-15' });

        expect(planDaySvc.findById).not.toHaveBeenCalled();
        expect((qs('#deferred-date') as HTMLInputElement).value).toBe('15-10-2026');
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain('Sin ejercicios');
    });

    it('shows the error state and retries the day-log fetch', async () => {
        planDaySvc.findById.and.returnValue(throwError(() => new Error('nope')));

        await setup({ date: '2026-10-15', id: 'day-1' });

        const retry = qs('[data-test="day-deferred-retry"]')!;
        expect(retry).toBeTruthy();

        planDaySvc.findById.and.returnValue(of(dayLog));
        retry.click();
        fixture.detectChanges();

        expect(planDaySvc.findById).toHaveBeenCalledTimes(2);
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain('Press banca');
    });

    it('ignores an invalid date query param', async () => {
        await setup({ date: 'not-a-date' });

        expect((qs('#deferred-date') as HTMLInputElement).value).toBe('—');
        expect(qs('[data-test="day-deferred-form"]')!.textContent).toContain('Sin ejercicios');
    });
});
