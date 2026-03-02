import { Component } from '@angular/core';
import { WaveLogoTextComponent } from '../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { CommonModule } from '@angular/common';
import { BtnComponent } from '../../shared/components/ui/btn/btn';
import { TrackingActiveComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-active/tracking-active';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.css',
    imports: [WaveLogoTextComponent, CommonModule, BtnComponent, TrackingActiveComponent],
})
export class Home {
    features = [
        {
            icon: '💪',
            title: 'Rutinas Personalizadas',
            description: 'Diseña tus entrenamientos semanales y ajústalos cuando lo necesites',
        },
        {
            icon: '📅',
            title: 'Seguimiento Semanal',
            description: 'Inicia y completa tus semanas de entrenamiento a tu propio ritmo',
        },
        {
            icon: '📈',
            title: 'Progreso Visual',
            description: 'Visualiza tu evolución y mantén la motivación día a día',
        },
    ];
}
