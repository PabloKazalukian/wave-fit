import { Component, DestroyRef, effect, inject, output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distributionToLogMode, LogMode } from '../../../../utils/profile.types';
import { UserProfileService } from '../../../../../core/services/user/user-profile.service';
import { SelectType } from '../../../../interfaces/input.interface';
import { FormSelectComponent } from '../../../ui/select/select';

@Component({
    selector: 'app-activation-selector',
    imports: [FormSelectComponent],
    templateUrl: './activation-selector.html',
})
export class ActivationSelector {
    userProfileSvc = inject(UserProfileService);
    destroyRef = inject(DestroyRef);

    modeChange = output<LogMode>();

    modeControl = new FormControl<string | null>('week');

    options: SelectType[] = [
        { name: 'Semana', value: 'week' },
        { name: 'Día', value: 'day' },
    ];

    constructor() {
        effect(() => {
            const distribution = this.userProfileSvc.userProfile()?.distributionDays;
            const next = distribution ? distributionToLogMode(distribution) : 'week';
            this.modeControl.setValue(next, { emitEvent: false });
            this.modeChange.emit(next);
        });

        this.modeControl.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((mode) => this.modeChange.emit((mode ?? 'week') as LogMode));
    }
}