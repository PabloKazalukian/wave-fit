import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-user-avatar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './avatar.html',
})
export class AvatarComponent {
    url = input<string | null | undefined>(null);
    name = input<string | undefined>('');
    size = input<'sm' | 'md' | 'lg'>('md');
    fill = input<boolean>(false);

    initial = computed(() => {
        const n = this.name();
        return n ? n.charAt(0).toUpperCase() : '?';
    });

    containerClasses = computed(() => {
        if (this.fill()) {
            return 'h-full min-w-9 w-auto rounded-none border-l border-primary/40';
        }
        const sizeMap = {
            sm: 'w-8 h-8 text-sm rounded-full border-2 border-primary/40',
            md: 'w-12 h-12 text-lg rounded-full border-2 border-primary/40',
            lg: 'w-16 h-16 text-3xl rounded-full border-2 border-primary/40',
        };
        return sizeMap[this.size()];
    });
}
