import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHighcharts } from 'highcharts-angular';
import { StatsPage } from './stats';
import { StatsService } from '../../core/services/stats/stats.service';
import {
    AdherenceVM,
    PersonalRecordsVM,
    StatsCategory,
    TopExercisesVM,
    TopRoutinesVM,
} from '../../shared/interfaces/stats.interface';

describe('StatsPage (TEST-011)', () => {
    let fixture: ComponentFixture<StatsPage>;
    let service: {
        getTopExercises: jasmine.Spy;
        getTopRoutines: jasmine.Spy;
        getPersonalRecords: jasmine.Spy;
        getAdherence: jasmine.Spy;
    };

    const chest = 'chest' as StatsCategory;

    const exercisesVm: TopExercisesVM = {
        id: 'te-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        exercises: [
            {
                rank: 1,
                exerciseId: 'ex-1',
                name: 'Press banca',
                category: chest,
                totalSessions: 5,
                totalVolume: 1200,
                avgVolumePerSession: 240,
            },
        ],
    };

    const routinesVm: TopRoutinesVM = {
        id: 'tr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        routines: [
            {
                rank: 1,
                planId: 'p-1',
                name: 'Push Pull Legs',
                totalWeeks: 4,
                totalSessions: 12,
                adherenceRate: 93,
            },
        ],
    };

    const recordsVm: PersonalRecordsVM = {
        id: 'pr-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        records: [
            {
                exerciseId: 'ex-1',
                exerciseName: 'Sentadilla',
                category: chest,
                oneRmEstimated: 120,
                bestWeight: 100,
                bestReps: 5,
                bestVolume: 500,
                achievedAt: '2026-09-15',
                previousOneRm: 110,
            },
        ],
    };

    const adherenceVm: AdherenceVM = {
        id: 'ad-1',
        userId: 'u-1',
        computedAt: '2026-09-20T10:05:00.000Z',
        weeks: [
            {
                weekStartDate: '2026-09-14',
                totalDays: 7,
                completedDays: 5,
                skippedDays: 1,
                pendingDays: 1,
                adherencePercent: 71,
            },
        ],
    };

    beforeEach(async () => {
        service = {
            getTopExercises: jasmine.createSpy('getTopExercises').and.returnValue(of(exercisesVm)),
            getTopRoutines: jasmine.createSpy('getTopRoutines').and.returnValue(of(routinesVm)),
            getPersonalRecords: jasmine
                .createSpy('getPersonalRecords')
                .and.returnValue(of(recordsVm)),
            getAdherence: jasmine.createSpy('getAdherence').and.returnValue(of(adherenceVm)),
        };

        await TestBed.configureTestingModule({
            imports: [StatsPage],
            providers: [provideHighcharts(), { provide: StatsService, useValue: service }],
        }).compileComponents();

        fixture = TestBed.createComponent(StatsPage);
        fixture.detectChanges();
    });

    it('triggers the four section queries in parallel on load', () => {
        expect(service.getTopExercises).toHaveBeenCalledTimes(1);
        expect(service.getTopRoutines).toHaveBeenCalledTimes(1);
        expect(service.getPersonalRecords).toHaveBeenCalledTimes(1);
        expect(service.getAdherence).toHaveBeenCalledTimes(1);
    });

    it('renders four stats sections', () => {
        const sections = fixture.nativeElement.querySelectorAll('app-stats-section');
        expect(sections.length).toBe(4);
    });

    it('renders the records list with the new-PR badge and previous 1RM', () => {
        const host = fixture.nativeElement as HTMLElement;
        expect(host.textContent).toContain('Sentadilla');
        expect(host.textContent).toContain('Nuevo PR');
        expect(host.textContent).toContain('1RM');
        expect(host.textContent).toContain('110,0');
    });

    it('reloads a failed section on retry without page reload', () => {
        service.getAdherence.and.returnValue(of(adherenceVm));
        fixture.componentInstance.reload('adherence');

        expect(service.getAdherence).toHaveBeenCalledTimes(2);
        expect(service.getTopExercises).toHaveBeenCalledTimes(1);
    });
});
