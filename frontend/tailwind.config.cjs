module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7c3aed',    // Violet
          secondary: '#06b6d4',  // Cyan
          accent: '#f59e0b',     // Amber
          danger: '#ef4444',     // Red
          success: '#10b981',    // Green
          warning: '#f59e0b',    // Amber
        },
        dark: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0e27',
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 100%)',
        'gradient-dark': 'linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(15,23,42,0.6) 100%)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(124, 58, 237, 0.5)',
        'glow-secondary': '0 0 20px rgba(6, 182, 212, 0.5)',
      },
    },
  },
  plugins: [],
}
