export type COLOR_VALUES =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'confirm'
    | 'surface'
    | 'success'
    | 'warning'
    | 'error'
    | 'text';

export const COLOR_MAP: Record<COLOR_VALUES, string> = {
    primary: '#6366f1',
    secondary: '#64748b',
    accent: '#f472b6',
    success: '#22c55e',
    error: '#ef4444',
    surface: '#e5e7eb',
    confirm: '#14b8a6',
    warning: '#facc15', // amarillo Tailwind 400/500
    text: '#ffffff', // o #000000 según tu tema, pero DEBE existir
};
