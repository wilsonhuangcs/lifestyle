/**
 * LifestyleAIO Shared Module — Barrel Export
 *
 * Usage:
 *   import { formatCurrency, generateId, colors } from '../shared';
 */

export {
  formatCurrency,
  formatDate,
  formatDateShort,
  generateId,
  clamp,
  percentage,
  mapRow,
  buildDbFields,
  getPrevMonth,
  getMonthRange,
} from './utils';

export {
  colors,
  categoryPresetColors,
  typography,
  spacing,
  borderRadius,
  shadows,
  transitions,
  breakpoints,
  gradients,
  layout,
} from './design-tokens';
