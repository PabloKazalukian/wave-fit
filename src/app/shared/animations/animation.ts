import { trigger, transition, style, animate, query, group, sequence } from '@angular/animations';

export const switchAnimation = trigger('switchAnimation', [
    transition('* <=> *', [
        sequence([
            // Primero animamos el que se va
            query(
                ':leave',
                [animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))],
                { optional: true },
            ),

            // Luego animamos el que entra
            query(
                ':enter',
                [
                    style({ opacity: 0, transform: 'translateY(10px)' }),
                    animate('450ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
                ],
                { optional: true },
            ),
        ]),
    ]),
]);
