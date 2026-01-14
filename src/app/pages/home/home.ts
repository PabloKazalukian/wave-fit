import { Component } from '@angular/core';
import { WaveLogoTextComponent } from '../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.css',
    imports: [WaveLogoTextComponent, CommonModule],
})
export class Home {
    weekActive: boolean = false;

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

    startTraining() {
        // Lógica para comenzar entrenamiento
        console.log('Comenzar entrenamiento');
    }
}
