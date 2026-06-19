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

    text = input<string>('');
    label = input<string>('');
    color = input<COLOR_VALUES>('primary');
    options = input<SelectType[]>([]);
    control = input<FormControl<(string | number)[] | null>>(
        new FormControl<(string | number)[] | null>([]),
    );
    max = input<number>(0);
    btnText = input<string>('enviar');
    send = output<void>();

    isOpen = signal(false);

    labelControl = computed(() => {
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
            const newValue = currentValues.filter((v) => v !== optionValue);
            this.control()?.setValue(newValue);
        } else {
            if (this.max() > 0 && currentValues.length >= this.max()) return;
            this.control()?.setValue([...currentValues, optionValue]);
        }
        this.control()?.markAsTouched();
    }

    isSelected(optionValue: string | number): boolean {
        return (this.control()?.value || []).includes(optionValue);
    }

    selectedCount = computed(() => (this.control()?.value || []).length);

    getSelectedLabel(): string {
        const count = this.selectedCount();
        if (count === 0) return this.text();
        if (count === 1) {
            const value = this.control()?.value?.[0];
            const option = this.options().find((opt) => opt.value === value);
            return option ? option.name : `${count} seleccionado`;
        }
        return `${count} seleccionados`;
    }

    emitSend(): void {
        this.send.emit();
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
