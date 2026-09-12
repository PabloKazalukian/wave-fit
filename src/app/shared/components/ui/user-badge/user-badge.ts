import { Component, input, output } from '@angular/core';
import { AvatarComponent } from '../avatar/avatar';

@Component({
    selector: 'app-user-badge',
    imports: [AvatarComponent],
    templateUrl: './user-badge.html',
    styles: ``,
})
export class UserBadge {
    url = input<string | null | undefined>(null);
    name = input<string | undefined>('');
    dropdownOpen = input<boolean>(false);
    rounded = input<string>('rounded-full');
    clicked = output<Event>();
}
