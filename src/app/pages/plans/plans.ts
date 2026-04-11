import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormSelectComponent } from '../../shared/components/ui/select/select';
import { FormControl, FormGroup } from '@angular/forms';
import { FormControlsOf } from '../../shared/utils/form-types.util';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { RoutinesService } from '../../core/services/routines/routines.service';
import { SelectType, SelectTypeInput } from '../../shared/interfaces/input.interface';
import { Exercise } from '../../shared/interfaces/exercise.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RoutinePlanAPI } from '../../shared/interfaces/api/routines-api.interface';
import { RouterModule } from '@angular/router';
import { TrackingWeekSkeletonComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-week-skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ExerciseCategory } from '../../shared/interfaces/exercise.interface';
import { LucideAngularModule, BookOpen } from 'lucide-angular';
import { InfoCard } from '../../shared/components/ui/info-card/info-card';

type selectFormType = FormControlsOf<SelectTypeInput>;

@Component({
    selector: 'app-plans',
    imports: [
        FormSelectComponent,
        BtnComponent,
        RouterModule,
        TrackingWeekSkeletonComponent,
        CommonModule,
        ReactiveFormsModule,
        LucideAngularModule,
        InfoCard,
    ],
    standalone: true,
    templateUrl: './plans.html',
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
export class Plans implements OnInit {
    private destroyRef = inject(DestroyRef);
    private readonly svcRoutines = inject(RoutinesService);

    feature = {
        icon: BookOpen,
        title: '¿Por dónde empezar?',
        description:
            'Explorá los planes semanales disponibles y seleccioná el que mejor se adapte a vos para iniciar el seguimiento de tus entrenamientos. También podés crear tu propio plan desde cero.',
    };

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

    filteredRoutinesPlans = computed(() => {
        const search = this.search().toLowerCase();
        const days = this.days();
        // const cats = this.selectedCategories() || [];
        const all = this.routinesPlans();

        return all.filter((plan) => {
            const matchesSearch = plan.name.toLowerCase().includes(search);
            const matchesDays = !days || plan.weekly_distribution === days;

            const matchesCategories = true;

            return matchesSearch && matchesDays && matchesCategories;
        });
    });

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
