---
name: Vedic Sovereign
colors:
  surface: '#fff8f1'
  surface-dim: '#e0d9ce'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf3e8'
  surface-container: '#f5ede2'
  surface-container-high: '#efe7dc'
  surface-container-highest: '#e9e1d7'
  on-surface: '#1e1b15'
  on-surface-variant: '#534438'
  inverse-surface: '#343029'
  inverse-on-surface: '#f7f0e5'
  outline: '#867466'
  outline-variant: '#d9c2b3'
  surface-tint: '#8f4e00'
  primary: '#8c4c00'
  on-primary: '#ffffff'
  primary-container: '#ab6318'
  on-primary-container: '#fffcff'
  inverse-primary: '#ffb77a'
  secondary: '#875300'
  on-secondary: '#ffffff'
  secondary-container: '#fda62f'
  on-secondary-container: '#6a4000'
  tertiary: '#92462c'
  on-tertiary: '#ffffff'
  tertiary-container: '#b15e42'
  on-tertiary-container: '#fffcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc2'
  primary-fixed-dim: '#ffb77a'
  on-primary-fixed: '#2e1500'
  on-primary-fixed-variant: '#6d3a00'
  secondary-fixed: '#ffddb9'
  secondary-fixed-dim: '#ffb964'
  on-secondary-fixed: '#2b1700'
  on-secondary-fixed-variant: '#663e00'
  tertiary-fixed: '#ffdbd0'
  tertiary-fixed-dim: '#ffb59d'
  on-tertiary-fixed: '#390c00'
  on-tertiary-fixed-variant: '#773219'
  background: '#fff8f1'
  on-background: '#1e1b15'
  surface-variant: '#e9e1d7'
  terracotta-lo: '#9a5814'
  amber: '#c67f1c'
  card-cream: '#fcebd1'
  saffron-deep: '#b5620a'
  saffron-lift: '#ffc04a'
  cocoa: '#6e3a11'
  card-title: '#8c4a12'
  body-warm: '#3d3226'
  hairline: '#e9b96a'
  panchang-navy: '#1f2b5e'
typography:
  display-lg:
    fontFamily: EB Garamond
    fontSize: 56px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: EB Garamond
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.3'
  headline-sm:
    fontFamily: EB Garamond
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  button:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
spacing:
  base: 8px
  margin-mobile: 16px
  margin-desktop: 64px
  gutter: 24px
  section-gap: 80px
---

## Brand & Style

This design system is built for a premium astrological and devotional platform that bridges ancient wisdom with modern accessibility. The brand personality is **authentic, authoritative, and deeply rooted in tradition**, yet remains direct and user-friendly.

The design style follows a **Vedic-Modernist** approach, blending high-contrast editorial typography with a rigid, geometric layout. It rejects modern soft-UI trends in favor of **Brutalist-Traditionalism**:
- **Sharp Geometry:** No rounded corners, emphasizing structure and permanence.
- **Graphic Depth:** Using hard, offset shadows and double-rule borders instead of blurs.
- **Ritualistic Details:** Incorporating notch-panel treatments and "chamfered" framing to evoke classical Indian architectural motifs and sacred manuscripts.

## Colors

The palette is a sophisticated "Saffron/Devotional" theme, utilizing earth tones and sunrise hues to evoke spiritual warmth.

- **Primary & Secondary:** Terracotta (#ab6318) and Saffron (#ee9a22) drive the main navigation and action states.
- **Canvas & Surfaces:** The page uses Cream (#fff7ec) as its base, with Card Cream (#fcebd1) providing a subtle tonal lift for nested information.
- **Typography Hierarchies:** Cocoa and Saffron-deep are used for headings on light backgrounds, while Saffron-lift provides essential contrast for text appearing on Deep Maroon app bands.
- **Cool Accents:** Panchang Navy is reserved for secondary data-heavy elements (like technical astrological charts or "Panchang" tables) to provide a necessary visual break from the warm palette.

## Typography

This design system uses a high-contrast typographic pairing to balance tradition and utility.

- **Display Type:** EB Garamond (as a high-quality alternative to Cormorant) is used for all major headings. It should be set with tight leading and slight negative tracking for a "literary" and authoritative feel.
- **Body Type:** Be Vietnam Pro provides wide apertures and excellent legibility, grounding the spiritual aesthetic with modern geometric precision.
- **Hierarchy:** Use the "Label Caps" style for overlines (text above headings) and metadata to add an editorial layer to the information architecture.

## Layout & Spacing

The layout is strictly structured on an **8px grid system** using a **fixed-width container** for desktop (1200px max) and fluid gutters for mobile.

- **Grid:** A 12-column grid is standard for desktop. Elements should align strictly to these grid lines to maintain the "Brutalist" order.
- **Rhythm:** Section spacing is generous (80px+) to allow the Cream canvas to breathe, reinforcing a premium, unhurried user experience.
- **Reflow:** On mobile, margins shrink to 16px. Grid-heavy card layouts (like service listings) should stack vertically or utilize horizontal snapping carousels.

## Elevation & Depth

This system avoids soft, naturalistic shadows. Depth is communicated through **Graphic Layering** and **Hard Offsets**:

- **Hard Offset Shadows:** Primary interactive elements (buttons, active cards) use a 4px or 8px offset shadow in a darker shade of orange (e.g., #9a5814) with 100% opacity.
- **Double-Rule Framing:** Cards do not use shadows. Instead, they use a "Hairline" (#e9b96a) border with a 2px inner inset rule of the same color, creating a framed "manuscript" effect.
- **Tonal Stepping:** Depth is also achieved by placing Card Cream (#fcebd1) surfaces on top of the main Cream (#fff7ec) canvas.

## Shapes

The shape language is strictly **Sharp (0px radius)**.

- **Notch-Panel Treatment:** For featured section headers or hero panels, use "chamfered brackets"—small geometric cut-ins at the vertical mid-points of the border.
- **Iconography:** Icons should be monolinear and geometric, avoiding overly rounded terminals to match the square edges of the UI components.

## Components

- **Buttons:** Rectangular with 0px radius. Primary buttons use Terracotta fill with white text and a Saffron hard-offset shadow. Secondary buttons use a double-rule hairline border.
- **Cards:** Always use the double-rule border (1px border, 2px inset). Headlines within cards should use the "Card Title" (#8c4a12) color.
- **Chips:** Small, rectangular tags with a Saffron (#ee9a22) background and Cocoa text. No rounded corners.
- **Input Fields:** Bottom-border only (1px Hairline) for a clean, minimalist look, or full square borders for search bars.
- **Notch Panels:** Use for "Daily Horoscope" or "Consultation" highlights. These panels feature a distinct inset "cut" in the border style to signify importance.
- **Dividers:** Use a thin Hairline (#e9b96a) line, occasionally broken in the center by a small geometric diamond or brand glyph.
