import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { ExtraSessionService } from '../../../../../core/services/extra-session/extra-session.service';
import { FormSelectComponent } from '../../../ui/select/select';
import { ExtraSessionCard } from '../extra-session-card/extra-session-card';
import { SelectType } from '../../../../../shared/interfaces/input.interface';
import { ExtraSessionCategory, ExtraSessionDisciplineConfig } from '../../../../../shared/interfaces/extra-session.interface';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-extra-session-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormSelectComponent, ExtraSessionCard],
  templateUrl: './extra-session-form.html',
})
export class ExtraSessionForm implements OnInit {
  private service = inject(ExtraSessionService);
  private fb = inject(FormBuilder);

  catalog = toSignal(this.service.catalog$, { initialValue: [] });
  
  categoryControl = this.fb.control<string>('', Validators.required);
  disciplineControl = this.fb.control<string>('', Validators.required);

  categories: SelectType[] = [
    { name: 'Cardio', value: ExtraSessionCategory.CARDIO },
    { name: 'Fuerza', value: ExtraSessionCategory.STRENGTH },
    { name: 'Deporte', value: ExtraSessionCategory.SPORT },
    { name: 'Mente y Cuerpo', value: ExtraSessionCategory.MIND_BODY },
  ];

  disciplineOptions = computed<SelectType[]>(() => {
    const category = this.categoryControl.value;
    if (!category) return [];
    
    return this.catalog()
      .filter(c => c.category === category)
      .map(c => ({ name: c.label, value: c.key }));
  });

  selectedDisciplineConfig = computed<ExtraSessionDisciplineConfig | null>(() => {
     const disc = this.disciplineControl.value;
     if (!disc) return null;
     return this.catalog().find(c => c.key === disc) || null;
  });

  constructor() {
    effect(() => {
      // Whenever category changes, reset discipline
      const cat = this.categoryControl.value;
      if (cat) {
        this.disciplineControl.reset();
      }
    });
  }

  ngOnInit() {
    this.service.loadCatalog();
    
    // Manual subscribe to form changes to trigger computed signals if effect doesn't catch reactive form change.
    this.categoryControl.valueChanges.subscribe(() => {
      this.disciplineControl.reset();
    });
  }

  resetForm() {
    this.categoryControl.reset();
    this.disciplineControl.reset();
  }
}
