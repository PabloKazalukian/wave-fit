import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControlsOf } from '../../../../../utils/form-types.util';
import { InputNumber } from '../../../../ui/input-number/input-number';
import { FormSelectComponent } from '../../../../ui/select/select';
import { MultiSelectComponent } from '../../../../ui/multi-select/multi-select';
import { SelectType } from '../../../../../interfaces/input.interface';
import { BtnComponent } from '../../../../ui/btn/btn';
import { UserProfileService } from '../../../../../../core/services/user/user-profile.service';
import {
    PreferredTime,
    RestDayActivity,
} from '../../../../../utils/profile.types';

export interface ScheduleForm {
    daysPerWeek: number;
    preferredDays: number[];
    sessionDurationMin: number;
    preferredTime: PreferredTime;
    restDayActivity: RestDayActivity;
}

type ScheduleFormType = FormControlsOf<ScheduleForm>;

@Component({
    selector: 'app-schedule',
    standalone: true,
    imports: [ReactiveFormsModule, InputNumber, BtnComponent, FormSelectComponent, MultiSelectComponent],
    templateUrl: './schedule.html',
})
export class Schedule implements OnInit {
    private destroyRef = inject(DestroyRef);
    private userProfileService = inject(UserProfileService);

    scheduleForm!: FormGroup<ScheduleFormType>;

    preferredDaysOptions: SelectType[] = [
        { name: 'Lunes', value: 1 },
        { name: 'Martes', value: 2 },
        { name: 'Miércoles', value: 3 },
        { name: 'Jueves', value: 4 },
        { name: 'Viernes', value: 5 },
        { name: 'Sábado', value: 6 },
        { name: 'Domingo', value: 7 },
    ];

    preferredTimeOptions: SelectType[] = [
        { name: 'Mañana', value: 'morning' },
        { name: 'Mediodía', value: 'noon' },
        { name: 'Tarde', value: 'afternoon' },
        { name: 'Noche', value: 'evening' },
    ];

    restDayActivityOptions: SelectType[] = [
        { name: 'Descanso total', value: 'full_rest' },
        { name: 'Caminata ligera', value: 'light_walk' },
        { name: 'Recuperación activa', value: 'active_recovery' },
        { name: 'Yoga/Estiramientos', value: 'yoga_stretching' },
    ];

    ngOnInit(): void {
        this.scheduleForm = this.initForm();

        this.userProfileService.userProfile$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((profile) => {
                if (!profile?.schedule) return;
                this.scheduleForm.patchValue({
                    daysPerWeek: profile.schedule.daysPerWeek,
                    preferredDays: profile.schedule.preferredDays || [],
                    sessionDurationMin: profile.schedule.sessionDurationMin,
                    preferredTime: profile.schedule.preferredTime || undefined,
                    restDayActivity: profile.schedule.restDayActivity || undefined,
                });
            });
    }

    initForm(): FormGroup<ScheduleFormType> {
        return new FormGroup<ScheduleFormType>({
            daysPerWeek: new FormControl(3, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(1), Validators.max(7)],
            }),
            preferredDays: new FormControl([], { nonNullable: true }),
            sessionDurationMin: new FormControl(60, {
                nonNullable: true,
                validators: [Validators.required, Validators.min(15)],
            }),
            preferredTime: new FormControl('' as PreferredTime, { nonNullable: true }),
            restDayActivity: new FormControl('' as RestDayActivity, { nonNullable: true }),
        });
    }

    onSubmit() {
        if (this.scheduleForm.invalid) return;
        this.userProfileService
            .updateSchedule(this.scheduleForm.getRawValue())
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe();
    }

    get daysPerWeekControl() {
        return this.scheduleForm.get('daysPerWeek')! as FormControl<number>;
    }

    get preferredDaysControl() {
        return this.scheduleForm.get('preferredDays')! as FormControl<(string | number)[]>;
    }

    get sessionDurationMinControl() {
        return this.scheduleForm.get('sessionDurationMin')! as FormControl<number>;
    }

    get preferredTimeControl() {
        return this.scheduleForm.get('preferredTime')! as FormControl<string>;
    }

    get restDayActivityControl() {
        return this.scheduleForm.get('restDayActivity')! as FormControl<string>;
    }
}
