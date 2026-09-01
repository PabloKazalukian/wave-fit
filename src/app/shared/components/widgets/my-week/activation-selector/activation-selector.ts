import { Component, inject, input, OnInit, output } from '@angular/core';
import {
    distributionToLogMode,
    LogMode,
} from '../../../../utils/profile.types';
import { UserProfileService } from '../../../../../core/services/user/user-profile.service';

@Component({
    selector: 'app-activation-selector',
    imports: [],
    templateUrl: './activation-selector.html',
})
export class ActivationSelector implements OnInit {
    userProfileSvc = inject(UserProfileService);

    mode = input<LogMode>('week');
    modeChange = output<LogMode>();

    defaultMode: LogMode = 'week';

    ngOnInit() {
        const distribution = this.userProfileSvc.userProfile()?.distributionDays;
        if (distribution) {
            this.defaultMode = distributionToLogMode(distribution);
            this.modeChange.emit(this.defaultMode);
        }
    }

    onModeChange(value: string) {
        this.modeChange.emit(value as LogMode);
    }
}
