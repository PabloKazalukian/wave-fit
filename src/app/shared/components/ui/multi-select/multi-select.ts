import {
    Component,
    input,
    output,
    signal,
    HostListener,
    ElementRef,
    inject,
    computed,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { SelectType } from '../../../interfaces/input.interface';
import { COLOR_VALUES } from '../../../utils/color.type';
import { BtnComponent } from '../btn/btn';

@Component({
    selector: 'app-multi-select',
    standalone: true,
    imports: [ReactiveFormsModule, NgClass, BtnComponent],
    templateUrl: './multi-select.html',
})
export class MultiSelectComponent {
    private elementRef = inject(ElementRef);

    text = input<string>(''); // Placeholder
    label = input<string>('');
    color = input<COLOR_VALUES>('primary');
    options = input<SelectType[]>([]);
    control = input<FormControl<any[] | null>>(new FormControl<any[] | null>([]));
    btnText = input<string>('enviar');
    onSend = output<void>();

    isOpen = signal(false);

    labelControl = computed(() => {
        console.log(this.label());
        if (this.label() !== undefined && this.label() !== '') return this.label();
        return 'Selecciona por grupo muscular';
    });

    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }

    toggleDropdown() {
        this.isOpen.update((v) => !v);
    }

    onOptionToggle(optionValue: string | number) {
        const currentValues = this.control()?.value || [];
        const index = currentValues.indexOf(optionValue);

        if (index > -1) {
            // Remove
            const newValue = currentValues.filter((v) => v !== optionValue);
            this.control()?.setValue(newValue);
        } else {
            // Add
            this.control()?.setValue([...currentValues, optionValue]);
        }
        this.control()?.markAsTouched();
    }

    isSelected(optionValue: string | number): boolean {
        return (this.control()?.value || []).includes(optionValue);
    }

    getSelectedLabel(): string {
        const selectedCount = (this.control()?.value || []).length;
        if (selectedCount === 0) return this.text();
        if (selectedCount === 1) {
            const value = this.control()?.value?.[0];
            const option = this.options().find((opt) => opt.value === value);
            return option ? option.name : `${selectedCount} seleccionado`;
        }
        return `${selectedCount} seleccionados`;
    }

    send(): void {
        this.onSend.emit();
        this.isOpen.set(false);
    }

    get triggerClasses() {
        return {
            'border-primary':
                this.isOpen() || (this.control()?.value?.length && this.color() === 'primary'),
            'border-surface': !this.isOpen() && !this.control()?.value?.length,
            'border-secondary': this.control()?.value?.length && this.color() === 'secondary',
            'border-accent': this.control()?.value?.length && this.color() === 'accent',
        };
    }
}
