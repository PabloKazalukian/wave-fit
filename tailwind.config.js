// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  
  safelist: [
  'p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-8',
    'px-3', 'px-4', 'px-5', 'px-6', 'px-8',
  // PRIMARY
  'bg-primary', 'bg-primary2', 'bg-primary3', 'bg-primaryLight', 'bg-primaryDark',
  'hover:bg-primary', 'hover:bg-primary2', 'hover:bg-primary3', 'hover:bg-primaryLight', 'hover:bg-primaryDark',
  'text-primary', 'text-primary2', 'text-primary3', 'text-primaryLight', 'text-primaryDark',
  'border-primary', 'border-primary2', 'border-primary3', 'border-primaryLight', 'border-primaryDark',

  // SECONDARY
  'bg-secondary', 'bg-secondary2', 'bg-secondary3', 'bg-secondaryLight', 'bg-secondaryDark',
  'hover:bg-secondary', 'hover:bg-secondary2', 'hover:bg-secondary3', 'hover:bg-secondaryLight', 'hover:bg-secondaryDark',
  'text-secondary', 'text-secondary2', 'text-secondary3', 'text-secondaryLight', 'text-secondaryDark',
  'border-secondary', 'border-secondary2', 'border-secondary3', 'border-secondaryLight', 'border-secondaryDark', 'text-secondaryText',

  'bg-confirm', 'bg-confirm2', 'bg-confirm3', 'bg-confirmLight', 'bg-confirmDark',
  'bg-accentDark', 'bg-accent2', 'bg-accent3', 'hover:bg-confirm', 'hover:bg-confirm2', 'hover:bg-confirm3', 'hover:bg-confirmLight', 'hover:bg-confirmDark',
  'text-confirm', 'text-confirm2', 'text-confirm3', 'text-confirmLight', 'text-confirmDark',
  'border-confirm', 'border-confirm2', 'border-confirm3', 'border-confirmLight', 'border-confirmDark',


  'bg-error', 'bg-error2', 'bg-error3', 'bg-errorLight', 'bg-errorDark',
  'hover:bg-error', 'hover:bg-error2', 'hover:bg-error3', 'hover:bg-errorLight', 'hover:bg-errorDark',
  'text-error', 'text-error2', 'text-error3', 'text-errorLight', 'text-errorDark',
  'border-error', 'border-error2', 'border-error3', 'border-errorLight', 'border-errorDark',

  'bg-success','text-surface',

  'shadow-primary',
'shadow-secondary',
'shadow-accent',
'shadow-error',
'shadow-success',
'shadow-surface',
'shadow-confirm',


  // Repetir igual para confirm, accent, success, error, warning, text
  // ...
],
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      },
    },
    extend: {
      backgroundImage: {
        'gradient-left-right': 'linear-gradient(to right, #121212, #151C17)',
        'gradient-bottom-left-top-right': 'linear-gradient(to top right, #121212, #295538)',        
        'gradient-background-1': 'linear-gradient(to bottom, #121212 15%, #151C17 80%,#18231C 95%, #1B2B20 100%)',
        

      },
      colors: {

        background: '#121212',
        background2: '#151C17',
        background3: '#1C2F22',
        background4: '#295538',
        warning: "#D66F6F",
        warningHover: "#A65353",
        
         // === PRIMARY (verde esmeralda) ===
        primary: "#50C878",
        'primary2': "#66D18A",   // más claro
        'primary3': "#3CA15E",   // más oscuro
        'primaryLight': "#A1E6BE",
        'primaryDark': "#2B6D41",
        'primaryHover': "#336343",


        // === SECONDARY (azul) ===
        secondary: "#3A6EBF",
        secondary2: "#5A8DD4",
        secondary3: "#2D5694",
        secondaryLight: "#A1C6EB",
        secondaryDark: "#1C3258",
        secondaryHover: "#2A5298",
        secondaryText: "#66aaf9",

        // === CONFIRM (rosa fuerte) ===
        confirm: "#C83A6E",
        confirm2: "#D65A88",
        confirm3: "#9F2C56",
        confirmLight: "#E89AB9",
        confirmDark: "#661934",
        confirmHover: "#9F2C56",

        // === ACCENT (amarillo oro) ===
        accent: "#F5C623",
        accent2: "#F8D250",
        accent3: "#D99E1B",
        accentLight: "#FBE69A",
        accentDark: "#7C6511",
        accentHover: "#C79E1B",

        // === SUCCESS (verde estándar) ===
        success: "#4CAF50",
        success2: "#6BC770",
        success3: "#3A8F3E",
        successLight: "#A5D6A7",
        successDark: "#1E4620",
        successHover: "#3A8F3E",

        // === ERROR (rojo intenso) ===
        error: "#CC1E2C",
        error2: "#E04A58",
        error3: "#9E1622",
        errorLight: "#F199A0",
        errorDark: "#5C0C11",
        errorHover: "#9E1622",

        // === WARNING (rojo pálido) ===
        warning: "#D66F6F",
        warning2: "#E08B8B",
        warning3: "#A65353",
        warningLight: "#F1B5B5",
        warningDark: "#632D2D",
        warningHover: "#A65353",

        // === TEXT ===
        text: "#2F2F2F",
        text2: "#adadad", // más claro
        text3: "#e5e5e5", // más oscuro
        textLight: "#6B6B6B",
        textDark: "#0D0D0D",
        textHover: "#1A1A1A",

      },
      fontFamily: {
        sans: ['Lato', 'sans-serif'],
        heading: ['Work Sans', 'sans-serif'],
      },
      
    },
  },
  plugins: [require('@tailwindcss/forms')],
};


