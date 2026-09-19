import { Component, inject } from '@angular/core';
import { DataSection } from '../../../ui/data-section/data-section';
import { UserProfileService } from '../../../../../core/services/user/user-profile.service';

@Component({
    selector: 'app-show-user-profile-data',
    imports: [DataSection],
    standalone: true,
    templateUrl: './show-user-profile-data.html',
    styles: ``,
})
export class ShowUserProfileData {
    private profileUserService = inject(UserProfileService);
    userProfile = this.profileUserService.userProfile;
}
