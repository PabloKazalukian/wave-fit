// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{html,ts}"],
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
      colors: {

        background: '#121212',
        background2: '#151C17',
        background3: '#1C2F22',
        background4: '#295538',
        warning: "#D66F6F",
        warningHover: "#A65353",
        
         // === PRIMARY (verde esmeralda) ===
    primary: "#50C878",
    primary2: "#66D18A",   // más claro
    primary3: "#3CA15E",   // más oscuro
    primaryLight: "#A1E6BE",
    primaryDark: "#2B6D41",
    primaryHover: "#336343",

    // === SECONDARY (azul) ===
    secondary: "#3A6EBF",
    secondary2: "#5A8DD4",
    secondary3: "#2D5694",
    secondaryLight: "#A7C6EB",
    secondaryDark: "#1C3258",
    secondaryHover: "#2A5298",

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
    accent3: "#C79E1B",
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
    text2: "#4A4A4A", // más claro
    text3: "#1A1A1A", // más oscuro
    textLight: "#6B6B6B",
    textDark: "#0D0D0D",
    textHover: "#1A1A1A",

      },
      backgroundImage: {
        'gradient-left-right': 'linear-gradient(to right, #121212, #151C17)',
        'gradient-bottom-left-top-right': 'linear-gradient(to top right, #121212, #295538)',        
        'gradient-background-1': 'linear-gradient(to bottom, #121212 15%, #151C17 80%,#18231C 95%, #1B2B20 100%)',
        

      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};


