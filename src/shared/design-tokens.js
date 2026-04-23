/**
 * LifestyleAIO Design Tokens
 *
 * Single source of truth for design values used across features.
 * CSS remains the primary styling mechanism (App.css), but these tokens
 * are available for JS logic that needs color/spacing values
 * (e.g., chart colors, dynamic styles, progress bar calculations).
 */

// --- Colors ---

export const colors = {
  primary: '#1a1a2e',
  primaryLight: '#16213e',
  accent: '#4ECDC4',
  accentSecondary: '#45B7D1',
  background: '#f0f2f5',
  surface: '#ffffff',

  textPrimary: '#1a1a2e',
  textSecondary: '#555',
  textTertiary: '#888',
  textMuted: '#999',
  textLight: '#aaa',
  textPlaceholder: '#ccc',

  income: '#2ecc71',
  incomeSecondary: '#27ae60',
  expense: '#e74c3c',
  expenseLight: '#ff6b6b',
  warning: '#f39c12',

  danger: '#e74c3c',
  dangerBg: '#fef0f0',
  successBg: '#f0fef4',
  activeBg: '#e8faf3',
  accentBg: '#f0fffe',

  border: '#e9ecef',
  borderLight: '#e0e0e0',
  divider: '#f0f0f0',
  dividerLight: '#f5f5f5',
  dividerLightest: '#f8f8f8',
};

export const categoryPresetColors = [
  '#FF6B6B', '#e74c3c', '#E91E63', '#FF6F00',
  '#F0B27A', '#F7DC6F', '#FFEAA7', '#2ecc71',
  '#27ae60', '#00b894', '#4ECDC4', '#1abc9c',
  '#45B7D1', '#3498db', '#2980b9', '#BB8FCE',
  '#9b59b6', '#DDA0DD', '#8e44ad', '#1a1a2e',
  '#555555', '#95a5a6', '#B0BEC5', '#34495e',
];

// --- Typography ---

export const typography = {
  fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",

  fontSize: {
    xs: '0.65rem',
    sm: '0.7rem',
    smPlus: '0.75rem',
    body2: '0.78rem',
    body: '0.8rem',
    bodyPlus: '0.85rem',
    normal: '0.9rem',
    base: '0.95rem',
    md: '1rem',
    lg: '1.1rem',
    xl: '1.15rem',
    xxl: '1.2rem',
    h2: '1.5rem',
    h1: '1.8rem',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  letterSpacing: {
    tight: '-0.5px',
    normal: '0',
    wide: '0.5px',
    wider: '1px',
  },
};

// --- Spacing ---

export const spacing = {
  '2xs': '2px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  '4xl': '32px',
  '5xl': '40px',
  '6xl': '80px',
};

// --- Border Radius ---

export const borderRadius = {
  sm: '4px',
  md: '6px',
  base: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '14px',
  '3xl': '16px',
  full: '50%',
};

// --- Shadows ---

export const shadows = {
  sm: '0 1px 4px rgba(0, 0, 0, 0.08)',
  card: '0 2px 10px rgba(0, 0, 0, 0.06)',
  navbar: '0 2px 8px rgba(0, 0, 0, 0.15)',
  dropdown: '0 8px 30px rgba(0, 0, 0, 0.15)',
  header: '0 4px 20px rgba(0, 0, 0, 0.15)',
  auth: '0 4px 24px rgba(0, 0, 0, 0.1)',
  tooltip: '0 4px 16px rgba(0, 0, 0, 0.12)',
  btnHover: '0 4px 12px rgba(78, 205, 196, 0.4)',
  btnIncomeHover: '0 4px 12px rgba(46, 204, 113, 0.4)',
  avatarHover: '0 0 0 3px rgba(78, 205, 196, 0.3)',
};

// --- Transitions ---

export const transitions = {
  fast: '0.1s',
  normal: '0.15s',
  medium: '0.2s',
  slow: '0.4s',
  easeOut: 'ease-out',
};

// --- Breakpoints ---

export const breakpoints = {
  mobile: '768px',
};

// --- Gradients ---

export const gradients = {
  headerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  primaryBtn: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
  authBtn: 'linear-gradient(135deg, #1a1a2e, #16213e)',
  incomeBtn: 'linear-gradient(135deg, #2ecc71, #27ae60)',
  selected: 'linear-gradient(135deg, #4ECDC4, #45B7D1)',
};

// --- Layout ---

export const layout = {
  appMaxWidth: '1100px',
  authMaxWidth: '400px',
  profileMaxWidth: '520px',
  navbarHeight: '56px',
  dropdownWidth: '280px',
  transactionMaxHeight: '500px',
};
