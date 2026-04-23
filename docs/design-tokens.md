# LifestyleAIO — Design Tokens

All tokens extracted from the existing `App.css`. Every new feature must use these values.

---

## Color Palette

### Core
| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#1a1a2e` | Navbar, header backgrounds, headings |
| `primaryLight` | `#16213e` | Header gradient end |
| `accent` | `#4ECDC4` | Focus rings, links, active states, primary buttons |
| `accentSecondary` | `#45B7D1` | Button gradient end, selected date |
| `background` | `#f0f2f5` | Page background |
| `surface` | `#ffffff` | Cards, dropdowns, inputs |

### Text
| Token | Hex | Usage |
|-------|-----|-------|
| `textPrimary` | `#1a1a2e` | Main body text |
| `textSecondary` | `#555` | Secondary descriptions |
| `textTertiary` | `#888` | Subtitles, hints |
| `textMuted` | `#999` | Metadata, section titles |
| `textPlaceholder` | `#ccc` | Default button icons |

### Semantic — Finance
| Token | Hex | Usage |
|-------|-----|-------|
| `income` | `#2ecc71` | Income amounts, success |
| `expense` | `#e74c3c` | Expense amounts, errors |
| `expenseLight` | `#ff6b6b` | Expense stat values |
| `warning` | `#f39c12` | Mid-range indicators |

### Borders
| Token | Hex |
|-------|-----|
| `border` | `#e9ecef` |
| `borderLight` | `#e0e0e0` |
| `divider` | `#f0f0f0` |

### Category Preset Colors
```
#FF6B6B  #e74c3c  #E91E63  #FF6F00
#F0B27A  #F7DC6F  #FFEAA7  #2ecc71
#27ae60  #00b894  #4ECDC4  #1abc9c
#45B7D1  #3498db  #2980b9  #BB8FCE
#9b59b6  #DDA0DD  #8e44ad  #1a1a2e
#555555  #95a5a6  #B0BEC5  #34495e
```

---

## Typography

**Font Family:** `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`

### Sizes
| Token | Value |
|-------|-------|
| `xs` | `0.65rem` |
| `sm` | `0.7rem` |
| `body` | `0.8rem` |
| `normal` | `0.9rem` |
| `base` | `0.95rem` |
| `md` | `1rem` |
| `lg` | `1.1rem` |
| `h2` | `1.5rem` |
| `h1` | `1.8rem` |

### Weights
| Token | Value |
|-------|-------|
| `normal` | 400 |
| `medium` | 500 |
| `semibold` | 600 |
| `bold` | 700 |

---

## Spacing
| Token | Value |
|-------|-------|
| `xs` | `4px` |
| `sm` | `8px` |
| `md` | `12px` |
| `lg` | `16px` |
| `xl` | `20px` |
| `2xl` | `24px` |
| `3xl` | `28px` |
| `4xl` | `32px` |

---

## Border Radius
| Token | Value |
|-------|-------|
| `sm` | `4px` |
| `md` | `6px` |
| `base` | `8px` |
| `xl` | `12px` |
| `2xl` | `14px` |
| `3xl` | `16px` |
| `full` | `50%` |

---

## Shadows
| Token | Value |
|-------|-------|
| `card` | `0 2px 10px rgba(0,0,0,0.06)` |
| `navbar` | `0 2px 8px rgba(0,0,0,0.15)` |
| `dropdown` | `0 8px 30px rgba(0,0,0,0.15)` |
| `header` | `0 4px 20px rgba(0,0,0,0.15)` |
| `btnHover` | `0 4px 12px rgba(78,205,196,0.4)` |

---

## Transitions
| Token | Value |
|-------|-------|
| `fast` | `0.1s` |
| `normal` | `0.15s` |
| `medium` | `0.2s` |
| `slow` | `0.4s` |

---

## Breakpoints
| Token | Value |
|-------|-------|
| `mobile` | `768px` |

---

## Gradients
| Token | Value |
|-------|-------|
| `headerBg` | `linear-gradient(135deg, #1a1a2e, #16213e)` |
| `primaryBtn` | `linear-gradient(135deg, #4ECDC4, #45B7D1)` |
| `incomeBtn` | `linear-gradient(135deg, #2ecc71, #27ae60)` |
