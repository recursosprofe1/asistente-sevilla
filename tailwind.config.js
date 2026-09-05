/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Nunito"', '"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        conn: {
          deep: '#0B3B42',        // Tinta verdosa oscura (texto)
          teal: '#12A5B5',        // Verde azulado protagonista
          tealDark: '#0E7E8C',    // Teal profundo (iconos, hero)
          tealDeep: '#0A5B66',    // Hero degradado
          aqua: '#E9F4F4',        // Fondo página
          mist: '#DFF1F2',        // Relleno suave (medallones, chips)
          muted: '#5E8B91',       // Texto atenuado verdoso
          amber: '#F5A623',       // Acento importante (En Hoy)
          amberSoft: '#FCEFD4',
        },
        medito: {
          bg: '#F0F4F8',             // Azul papel sereno
          'bg-alt': '#EBF2FA',         // Azul brisa suave
          card: '#FFFFFF',           // Blanco puro
          'card-soft': '#F6F9FD',    // Blanco azulado suave
          'border': '#E2E8F0',       // Borde suave
          'border-focus': '#93C5FD', // Borde acento
          deep: '#1E3A8A',           // Azul profundo Medito
          primary: '#3B82F6',        // Azul cobalto suave
          'primary-hover': '#2563EB',
          accent: '#93C5FD',         // Azul pastel
          light: '#DBEAFE',          // Azul cielo tenue
          muted: '#64748B',          // Texto atenuado
          text: '#0F172A',           // Texto principal nítido pero suave
        },
        theme: {
          bg: 'var(--color-bg)',
          card: 'var(--color-card)',
          'card-subtle': 'var(--color-card-subtle)',
          border: 'var(--color-border)',
          'border-focus': 'var(--color-border-focus)',
          text: 'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          'primary-text': 'var(--color-primary-text)',
          secondary: 'var(--color-secondary)',
          'secondary-hover': 'var(--color-secondary-hover)',
          accent: 'var(--color-accent)',
          surface: 'var(--color-surface)',
        }
      },
      boxShadow: {
        'serene-sm': '0 2px 10px -1px rgba(30, 58, 138, 0.05)',
        'serene': '0 8px 25px -3px rgba(30, 58, 138, 0.07)',
        'serene-lg': '0 16px 36px -4px rgba(30, 58, 138, 0.10)',
        'serene-glow': '0 0 20px rgba(59, 130, 246, 0.18)',
      },
      borderRadius: {
        '3xl': '1.5rem',     // 24px
        '4xl': '2rem',       // 32px
        'card': '1.625rem',  // ~26px estilo Medito
      }
    },
  },
  plugins: [],
}
