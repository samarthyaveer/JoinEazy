/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', 'ui-sans-serif', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'SF Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        'hero':    ['56px', { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.035em' }],
        'page':    ['44px', { lineHeight: '1.1',  fontWeight: '700', letterSpacing: '-0.03em' }],
        'section': ['22px', { lineHeight: '1.3',  fontWeight: '600', letterSpacing: '-0.02em' }],
        'body':    ['15px', { lineHeight: '1.6',  fontWeight: '400' }],
        'meta':    ['13px', { lineHeight: '1.5',  fontWeight: '400' }],
        'label':   ['11px', { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.06em' }],
      },
      colors: {
        /* Surface — warm off-white base (Awwwards SOTDs) */
        surface: {
          DEFAULT: '#FAFAF8',
          raised:  '#FFFFFF',
          overlay: '#F2F2F0',
          hover:   '#EAEAE8',
          border:  'rgba(0,0,0,0.06)',
        },
        /* Accent — electric blue (Awwwards staple) */
        accent: {
          DEFAULT: '#0055FF',
          hover:   '#0044CC',
          light:   'rgba(0,85,255,0.08)',
          muted:   'rgba(0,85,255,0.15)',
          text:    '#0055FF',
        },
        /* Text — rich black scale (never pure #000) */
        text: {
          primary:   '#0F0F0F',
          secondary: '#6B6B6B',
          tertiary:  '#A0A0A0',
          inverse:   '#FFFFFF',
        },
        /* Borders — barely-there for light theme */
        border: {
          DEFAULT: 'rgba(0,0,0,0.06)',
          subtle:  'rgba(0,0,0,0.03)',
          strong:  'rgba(0,0,0,0.12)',
        },
        /* Semantic — vivid & accessible on light bg */
        semantic: {
          success: '#16A34A',
          warning: '#D97706',
          danger:  '#DC2626',
        },
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        'card': '16px',
      },
      maxWidth: {
        'page': '1200px',
      },
      boxShadow: {
        'dock':  '0 0 0 1px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)',
        'card':  '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        'card-hover': '0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glow':  '0 0 24px rgba(0,85,255,0.12), 0 0 8px rgba(0,85,255,0.06)',
        'modal': '0 0 0 1px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)',
        'input': '0 1px 2px rgba(0,0,0,0.04)',
        'button': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
