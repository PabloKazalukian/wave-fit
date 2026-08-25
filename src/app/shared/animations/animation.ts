import { trigger, transition, style, animate, query, sequence } from '@angular/animations';

export const fadeInOut = trigger('fadeInOut', [
    transition('* <=> *', [
        sequence([
            query(
                ':leave',
                [animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-12px)' }))],
                { optional: true },
            ),
            query(
                ':enter',
                [
                    style({ opacity: 0, transform: 'translateY(12px)' }),
                    animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
                ],
                { optional: true },
            ),
        ]),
    ]),
]);

export const switchAnimation = trigger('switchAnimation', [
    transition('* <=> *', [
        sequence([
            // Primero animamos el que se va
            query(
                ':leave',
                [animate('250ms ease-in', style({ opacity: 0, transform: 'translateY(10px)' }))],
                { optional: true },
            ),

            // Luego animamos el que entra
            query(
                ':enter',
                [
                    style({ opacity: 0, transform: 'translateY(0px)' }),
                    animate('150ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
                ],
                { optional: true },
            ),
        ]),
    ]),
]);
