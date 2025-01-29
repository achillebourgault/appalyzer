export const theme = {
  colors: {
    background: '#1a1a1a',
    surface: '#242424',
    titleBar: '#141517',
    primary: '#6b63ff',
    secondary: '#ff63a5',
    text: '#ffffff',
    textSecondary: '#b3b3b3',
    gold: '#ffd700',
    error: '#ff6b6b',
    success: '#63ff8f',
    primaryHover: '#2563EB',
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.2)',
    border: '#2C2E33'
  },
  shadows: {
    neumorph: `
      -5px -5px 10px rgba(255, 255, 255, 0.05),
      5px 5px 10px rgba(0, 0, 0, 0.5)
    `,
    neumorphInset: `
      inset -5px -5px 10px rgba(255, 255, 255, 0.05),
      inset 5px 5px 10px rgba(0, 0, 0, 0.5)
    `
  },
  blur: {
    light: 'blur(5px)',
    medium: 'blur(10px)',
    heavy: 'blur(20px)'
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    round: '50%'
  },
  transitions: {
    default: '0.3s ease',
    fast: '0.15s ease',
    slow: '0.5s ease'
  }
};
