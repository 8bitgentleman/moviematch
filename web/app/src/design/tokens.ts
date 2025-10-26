/**
 * Design System Tokens for MovieMatch Phase 3 UI Redesign
 *
 * Based on UI_idea.png mockup and PLAN.md requirements
 */

export const colors = {
  // Base colors
  background: '#000000',
  surface: '#1a1a1a',

  text: {
    primary: '#ffffff',
    secondary: '#b3b3b3',
    tertiary: '#666666',
  },

  // Action button colors (4 buttons per requirements)
  actions: {
    undo: '#ff9500',      // Orange - Undo last swipe
    reject: '#ff2d55',     // Red - Reject/Skip
    bookmark: '#007aff',   // Blue - Add to Plex watchlist
    like: '#34c759',       // Green - Like/Match
  },

  // Bottom navigation
  navBar: {
    background: 'rgba(0, 0, 0, 0.95)',
    active: '#ff9500',     // Orange for active tab
    inactive: '#666666',   // Gray for inactive tabs
  },

  // UI elements
  border: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    heavy: 'rgba(255, 255, 255, 0.3)',
  },

  // Semantic colors
  success: '#34c759',
  error: '#ff2d55',
  warning: '#ff9500',
  info: '#007aff',

  // Genre tag colors
  genreTag: {
    background: 'rgba(255, 255, 255, 0.15)',
    text: '#ffffff',
    border: 'rgba(255, 255, 255, 0.3)',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const borderRadius = {
  sm: '8px',
  md: '16px',
  lg: '24px',
  pill: '999px',
  circle: '50%',
} as const;

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },

  fontSize: {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
    '4xl': '36px',
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.7)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.8)',
} as const;

export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',

  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

export const zIndex = {
  base: 0,
  dropdown: 1000,
  modal: 2000,
  popover: 3000,
  toast: 4000,
  tooltip: 5000,
} as const;

// Action button sizes
export const actionButtonSizes = {
  sm: {
    width: '48px',
    height: '48px',
    iconSize: '20px',
  },
  md: {
    width: '64px',
    height: '64px',
    iconSize: '28px',
  },
  lg: {
    width: '80px',
    height: '80px',
    iconSize: '36px',
  },
} as const;

// Bottom navigation dimensions
export const bottomNav = {
  height: '80px',
  iconSize: '28px',
  badgeSize: '20px',
} as const;

// Progress bar dimensions
export const progressBar = {
  height: '4px',
  gap: '8px',
  topOffset: '16px',
} as const;
