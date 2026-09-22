import { Component, input } from '@angular/core';
import {
    ExtraSession,
    ExtraSessionCategory,
    ExtraSessionDisciplineConfig,
} from '../../../../interfaces/extra-session.interface';

@Component({
    selector: 'app-extra-session-show',
    standalone: true,
    templateUrl: './extra-session-show.html',
    styles: [':host { display: block; }'],
})
export class ExtraSessionShow {
    session = input.required<ExtraSession>();
    disciplines = input.required<ExtraSessionDisciplineConfig[]>();

    readonly ExtraSessionCategory = ExtraSessionCategory;

    getDisciplineLabel(): string {
        const config = this.disciplines().find((d) => d.key === this.session().discipline);
        return config?.label || this.session().discipline;
    }
}
