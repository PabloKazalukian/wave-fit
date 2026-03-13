import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormSelectComponent } from '../../shared/components/ui/select/select';
import { FormControl, FormGroup } from '@angular/forms';
import { FormControlsOf } from '../../shared/utils/form-types.util';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { UserService } from '../../core/services/user/user.service';
import { RoutinesServices } from '../../core/services/routines/routines.service';
import { SelectType, SelectTypeInput } from '../../shared/interfaces/input.interface';
import { Exercise } from '../../shared/interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinePlanAPI } from '../../shared/interfaces/api/routines-api.interface';
import { RouterModule } from '@angular/router';
import { ExercisesTableComponent } from '../../shared/components/widgets/exercises/table/exercises-table';
import { TrackingWeekSkeletonComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week-skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExerciseCategory } from '../../shared/interfaces/exercise.interface';

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-routines',
    imports: [
        FormSelectComponent,
        BtnComponent,
        RouterModule,
        TrackingWeekSkeletonComponent,
        CommonModule,
        ReactiveFormsModule,
    ],
    standalone: true,
    templateUrl: './routines.html',
    animations: [
        trigger('chipAnimation', [
            transition(':enter', [
                style({ opacity: 0, transform: 'scale(0.8)' }),
                animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' })),
            ]),
            transition(':leave', [
                animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.8)' })),
            ]),
        ]),
    ],
})
export class Routines implements OnInit {
    private destroyRef = inject(DestroyRef);

    options: SelectType[] = [
        { name: '1/7', value: '1' },
        { name: '2/7', value: '2' },
        { name: '3/7', value: '3' },
        { name: '4/7', value: '4' },
        { name: '5/7', value: '5' },
        { name: '6/7', value: '6' },
        { name: '7/7', value: '7' },
    ];

    loading = signal<boolean>(true);
    routinesPlans = signal<RoutinePlanAPI[]>([]);
    exercises = signal<Exercise[]>([]);

    selectForm!: FormGroup<selectFormType>;
    showSelected = '';

    searchControl = new FormControl('', { nonNullable: true });
    daysControl = new FormControl('', { nonNullable: true });

    search = toSignal(this.searchControl.valueChanges, { initialValue: '' });
    days = toSignal(this.daysControl.valueChanges, { initialValue: '' });

    allCategories = computed(() => {
        const categories = new Set<ExerciseCategory>();
        this.routinesPlans().forEach((plan) => {
            plan.routineDays?.forEach((day) => {
                day.category?.forEach((cat) => categories.add(cat));
            });
        });
        return Array.from(categories);
    });

    // sortedCategories = computed(() => {
    //     const selected = this.selectedCategories() || [];
    //     const all = this.allCategories();

    //     console.log(selected);
    //     return [...all].sort((a, b) => {
    //         const aSelected = selected.includes(a);
    //         const bSelected = selected.includes(b);

    //         if (aSelected && !bSelected) return -1;
    //         if (!aSelected && bSelected) return 1;

    //         return a.localeCompare(b);
    //     });
    // });

    filteredRoutinesPlans = computed(() => {
        const search = this.search().toLowerCase();
        const days = this.days();
        // const cats = this.selectedCategories() || [];
        const all = this.routinesPlans();

        return all.filter((plan) => {
            const matchesSearch = plan.name.toLowerCase().includes(search);
            const matchesDays = !days || plan.weekly_distribution === days;

            let matchesCategories = true;

            return matchesSearch && matchesDays && matchesCategories;
        });
    });

    private readonly svcUser = inject(UserService);
    private readonly svcRoutines = inject(RoutinesServices);

    ngOnInit(): void {
        this.selectForm = this.initForm();

        this.svcRoutines
            .getRoutinesPlans()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((result) => {
                this.routinesPlans.set(result);
                this.loading.set(false);
            });

        this.selectControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((newValue: string) => {
                this.showSelected = newValue;
            });
    }

    clear() {
        this.daysControl.setValue('');
    }

    initForm(): FormGroup<selectFormType> {
        return new FormGroup<selectFormType>({
            option: new FormControl('', { nonNullable: true }),
        });
    }

    get selectControl(): FormControl<string> {
        return this.daysControl;
    }
}
