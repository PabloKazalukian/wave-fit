export type COLOR_VALUES =
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'confirm'
    | 'surface'
    | 'success'
    | 'warning'
    | 'error'
    | 'background2'
    | 'text';

export const COLOR_MAP: Record<COLOR_VALUES, string> = {
    background2: '#151C17',
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

export type LOADER_SIZE = 'sm' | 'md' | 'lg';
