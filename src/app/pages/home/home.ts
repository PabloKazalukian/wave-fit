import { Component } from '@angular/core';
import { WaveLogoTextComponent } from '../../shared/components/ui/logos/wave-logo-text/wave-logo-text';
import { CommonModule } from '@angular/common';
import { TrackingActiveComponent } from '../../shared/components/widgets/tracking/tracking-week/tracking-active/tracking-active';

@Component({
    selector: 'app-home',
    standalone: true,
    templateUrl: './home.html',
    styleUrl: './home.css',
    imports: [WaveLogoTextComponent, CommonModule, TrackingActiveComponent],
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

    upcomingFeatures = [
        {
            icon: '📱',
            title: 'Instalá WaveFit',
            description: 'Pronto vas a poder añadir WaveFit a tu pantalla de inicio y usarla como una app nativa, sin necesidad de ninguna tienda. Rápida, ligera y siempre a mano.',
        },
        {
            icon: '📊',
            title: 'Tu progreso, en números',
            description: 'Visualizá tu evolución semana a semana: volumen total, frecuencia por grupo muscular, racha de entrenamientos y mucho más. Porque lo que se mide, mejora.',
        },
        {
            icon: '🎯',
            title: 'Entrenamiento con propósito',
            description: 'Elegí una meta — ganar fuerza, definir, mejorar resistencia — o dejate guiar por una recomendación personalizada. WaveFit va a armar el plan y vos solo tenés que seguirlo.',
        },
        {
            icon: '🤖',
            title: 'Tu entrenador inteligente',
            description: 'Un asistente con IA que te ayuda a iniciar tu seguimiento, crear rutinas desde cero y tomar mejores decisiones de entrenamiento. Como tener un coach, pero siempre disponible.',
        },
    ];
}
