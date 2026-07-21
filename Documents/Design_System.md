# Sentinel Design System

## Philosophy

Premium, minimal, product-first design language inspired by Linear, Vercel, Stripe, Apple, Anthropic, and Notion. Every UI decision prioritizes clarity, whitespace, and professionalism.

---

## Color Palette

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--color-base` | `#0A0A0F` | Page background |
| `--color-surface` | `#111118` | Card surfaces |
| `--color-elevated` | `#1A1A26` | Hover/elevated surfaces |
| `--color-hover` | `#20202E` | Hover states |

### Text

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#F0EEF8` | Primary text |
| `--color-muted` | `#7B7A8E` | Secondary/muted text |
| `--color-dim` | `#4A4858` | Dim/placeholder text |

### Accent

| Token | Value |
|-------|-------|
| Accent (primary) | `#6E56CF` |
| Accent dim | `#3D2F8A` |
| Accent light | `#A891FF` |
| Success | `#56CF8A` |
| Warning | `#F6C445` |
| Danger | `#CF5656` |

### Borders

| Token | Value |
|-------|-------|
| Border | `#1E1E2E` |
| Border light | `#2A2A3E` |

---

## Typography

| Property | Value |
|----------|-------|
| Primary font | Inter |
| Monospace font | JetBrains Mono |
| Heading weight | 700–800 |
| Body weight | 400–500 |

---

## Border Radius

| Element | Radius |
|---------|--------|
| Cards | 16px |
| Buttons | 12px |
| Inputs | 12px |
| Badges | 999px (pill) |

---

## Spacing System

Base unit: 4px. Common values: 4, 8, 12, 16, 24, 32, 48, 64.

---

## Animation

- Library: Framer Motion
- Duration: 150ms / 250ms / 400ms (never exceed 500ms)
- Easing: easeOut
- Animations communicate state, not decoration.

---

## Design Rules

- Lots of whitespace
- One accent color (`#6E56CF`)
- Dark theme only
- Consistent spacing
- Clear hierarchy
- Responsive layout

## Never Do

- Rainbow colors
- Glassmorphism everywhere
- Bootstrap-looking layouts
- Stock illustrations
- Giant gradients
- Excessive animations
- More than one accent color
