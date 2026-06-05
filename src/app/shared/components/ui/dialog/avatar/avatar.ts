import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, Upload } from 'lucide-angular';
import { animate, style, transition, trigger } from '@angular/animations';
import { FormControlsOf } from '../../../../utils/form-types.util';
import { FormControl, FormGroup } from '@angular/forms';
import { BtnComponent } from '../../btn/btn';
import { AuthService } from '../../../../../core/services/auth/auth.service';

export interface AvatarForm {
    file: File | null;
}

type AvatarFormType = FormControlsOf<AvatarForm>;

@Component({
    selector: 'app-avatar',
    standalone: true,
    imports: [CommonModule, LucideAngularModule, BtnComponent],
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
    private readonly authService = inject(AuthService);

    isOpen = input<boolean>(false);
    title = input<string>('Cambiar foto de perfil');
    closeOnBackdrop = input<boolean>(true);
    closed = output<void>();

    private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;
    private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

    avatarForm = this.initForm();

    readonly XIcon = X;
    readonly UploadIcon = Upload;

    previewUrl: string | null = null;
    fileName = '';
    fileSize = '';

    private initForm(): FormGroup<AvatarFormType> {
        return new FormGroup<AvatarFormType>({
            file: new FormControl<File | null>(null),
        });
    }

    close() {
        this.revokePreview();
        this.closed.emit();
    }

    private revokePreview(): void {
        if (this.previewUrl) {
            URL.revokeObjectURL(this.previewUrl);
            this.previewUrl = null;
        }
        this.fileName = '';
        this.fileSize = '';
        this.avatarForm.controls.file.setValue(null);
    }

    onBackdropClick() {
        if (this.closeOnBackdrop()) {
            this.close();
        }
    }

    private formatSize(bytes: number): string {
        return `${(bytes / 1024).toFixed(2)} KB / ${this.MAX_FILE_SIZE / 1024} KB max`;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;

        const file = input.files?.[0];

        if (!file) return;

        this.avatarForm.controls.file.setValue(file);

        this.fileName = file.name;

        this.fileSize = this.formatSize(file.size);

        this.previewUrl = URL.createObjectURL(file);
    }

    async onSave(): Promise<void> {
        const file = this.avatarForm.controls.file.value;
        if (!file) return;

        if (!this.ALLOWED_TYPES.includes(file.type)) {
            console.error('Tipo de archivo no permitido:', file.type);
            return;
        }

        if (file.size > this.MAX_FILE_SIZE) {
            console.error('Archivo demasiado grande:', file.size);
            return;
        }

        const base64Image = await this.fileToBase64(file);

        this.authService.updateAvatar(base64Image).subscribe({
            next: () => {
                this.revokePreview();
                this.closed.emit();
            },
            error: (err) => {
                console.error('Error al subir avatar:', err);
            },
        });
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    get fileControl(): FormControl<File | null> {
        return this.avatarForm.get('file') as FormControl<File | null>;
    }
}
