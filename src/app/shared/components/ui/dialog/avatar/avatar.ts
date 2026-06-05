import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Upload } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
    selector: 'app-avatar',
    standalone: true,
    imports: [CommonModule, LucideAngularModule],
    templateUrl: './avatar.html',
    animations: [
        trigger('backdropAnimation', [
            transition(':enter', [
                style({ opacity: 0 }),
                animate('200ms ease-out', style({ opacity: 1 })),
            ]),
            transition(':leave', [animate('200ms ease-in', style({ opacity: 0 }))]),
        ]),
        trigger('slideUp', [
            transition(':enter', [
                style({ transform: 'translateY(100%)', opacity: 0 }),
                animate(
                    '300ms cubic-bezier(0.32, 0.72, 0, 1)',
                    style({ transform: 'translateY(0)', opacity: 1 }),
                ),
            ]),
            transition(':leave', [
                animate(
                    '250ms cubic-bezier(0.32, 0.72, 0, 1)',
                    style({ transform: 'translateY(100%)', opacity: 0 }),
                ),
            ]),
        ]),
    ],
})
export class Avatar {
    isOpen = input<boolean>(false);
    title = input<string>('Cambiar foto de perfil');
    closeOnBackdrop = input<boolean>(true);
    closed = output<void>();

    readonly XIcon = X;
    readonly UploadIcon = Upload;

    fileName = 'foto_perfil.jpg';
    fileSize = '0 KB / 10 KB max';

    close() {
        this.closed.emit();
    }

    onBackdropClick() {
        if (this.closeOnBackdrop()) {
            this.close();
        }
    }

    onFileSelected(_event: Event) {
        // No-op: manejo de archivo se implementará después
    }
}
