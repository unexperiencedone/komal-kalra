---
name: Silent Luxury
colors:
  surface: '#fdf9f2'
  surface-dim: '#ded9d3'
  surface-bright: '#fdf9f2'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f8f3ec'
  surface-container: '#f2ede6'
  surface-container-high: '#ece8e1'
  surface-container-highest: '#e6e2db'
  on-surface: '#1d1c18'
  on-surface-variant: '#45464c'
  inverse-surface: '#32302c'
  inverse-on-surface: '#f5f0e9'
  outline: '#76777c'
  outline-variant: '#c6c6cc'
  surface-tint: '#595e6d'
  primary: '#030612'
  on-primary: '#ffffff'
  primary-container: '#1a1f2c'
  on-primary-container: '#828697'
  inverse-primary: '#c2c6d8'
  secondary: '#8e4e0b'
  on-secondary: '#ffffff'
  secondary-container: '#fda861'
  on-secondary-container: '#743c00'
  tertiary: '#070604'
  on-tertiary: '#ffffff'
  tertiary-container: '#201f1b'
  on-tertiary-container: '#898681'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dee2f4'
  primary-fixed-dim: '#c2c6d8'
  on-primary-fixed: '#161b28'
  on-primary-fixed-variant: '#424655'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77e'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#e6e2db'
  tertiary-fixed-dim: '#cac6bf'
  on-tertiary-fixed: '#1d1c18'
  on-tertiary-fixed-variant: '#484742'
  background: '#fdf9f2'
  on-background: '#1d1c18'
  surface-variant: '#e6e2db'
  cosmic-navy: '#1a1f2c'
  warm-ivory: '#fef9f2'
  muted-gold: '#a45f1e'
  linen-grey: '#ece7e1'
  ink-black: '#17120e'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 72px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '600'
    lineHeight: '1.15'
  headline-h1:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-h1-mobile:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-h2:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Public Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-base:
    fontFamily: Public Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Public Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.12em
  label-small:
    fontFamily: Public Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: '1.2'
spacing:
  container-max: 1280px
  gutter: 24px
  section-lg: 120px
  section-md: 80px
  unit: 8px
---

## Brand & Style

The design system is a transition from the ethereal to the essential, embodying the "Silent Luxury" aesthetic. It moves away from mystical clichés toward a visual language of **Professional Sophistication** and **Curated Calm**. The brand personality is authoritative yet understated, appealing to an affluent audience that values discretion, precision, and timelessness.

**Design Style: Elevated Minimalism**
- **Quiet Authority:** A heavy reliance on intentional whitespace to evoke a sense of exclusivity and breathing room.
- **Architectural Precision:** Every element is placed with purpose, using a strict grid and high-quality photography to anchor the experience.
- **Material Restraint:** The aesthetic avoids unnecessary decoration, focusing instead on the interplay between deep cosmic tones and warm organic surfaces.
- **Refined Contrast:** High-contrast typography and subtle textural shifts replace shadows and gradients to define hierarchy.

## Colors

The palette is rooted in a triad of prestige colors. The interaction between **Deep Cosmic Navy** and **Warm Ivory** creates a high-end editorial feel, while **Muted Gold** is used sparingly as a mark of quality.

- **Primary (Cosmic Navy):** Used for grounding the brand, high-impact sections, and primary typography in light modes. It represents the depth of knowledge and authority.
- **Secondary (Muted Gold):** Reserved strictly for refined accents, active states, and hairline details. It should never overwhelm the layout.
- **Tertiary (Warm Ivory):** The primary canvas. This off-white provides a softer, more luxurious feel than pure white, reducing digital eye strain.
- **Neutral (Ink Black):** Used for body text and functional UI elements to ensure maximum legibility against the Ivory backdrop.

## Typography

The typographic pairing is designed to communicate "Heritage meets Modernity."

- **Playfair Display (Headings):** Used for all display and headline roles. It provides an elegant, literary flair. For large display sizes, use a slightly tighter letter spacing to enhance the premium feel.
- **Public Sans (Body & UI):** A neutral, highly legible sans-serif that balances the expressiveness of the serif. It ensures that technical details and advisory content are perceived as objective and modern.
- **Styling Note:** Use "Label Caps" for eyebrows and small navigation elements, always in uppercase with increased letter spacing to denote a curated, organized structure.

## Layout & Spacing

This design system employs a **Fixed Grid** philosophy with generous margins to create an "Editorial Boutique" experience.

- **Desktop (1024px+):** A 12-column grid within a 1280px container. Horizontal padding starts at 48px to keep content from hitting the edges.
- **Section Rhythm:** Large vertical gaps (80px to 120px) are used to separate content blocks, ensuring each message has the user's undivided attention.
- **Mobile (<768px):** Content collapses to a single column with 24px side margins. Large headings should scale down to prevent awkward word breaks.
- **Photography Layouts:** Images should often span 6 or 8 columns, leaving adjacent empty space to reinforce the minimalist aesthetic.

## Elevation & Depth

To maintain the "Silent Luxury" feel, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than traditional shadows.

- **Flat Hierarchy:** Elements exist on a single plane or are separated by subtle shifts in background color (e.g., Warm Ivory to Linen Grey).
- **Hairline Borders:** Use 1px borders in Muted Gold (at 20-30% opacity) or Linen Grey to define containers. This provides structure without the "weight" of shadows.
- **Active State Elevation:** On hover, elements may transition to a slightly lighter surface color or introduce a very fine, sharp border. 
- **Glassmorphism:** Reserved only for persistent navigation bars, using a `backdrop-blur` and a high-transparency Warm Ivory tint to maintain a sense of lightness as the user scrolls.

## Shapes

The shape language is **Strict and Architectural**. 

- **Sharp Edges:** All buttons, inputs, and cards use 0px roundedness. This conveys a sense of precision, high-end tailoring, and professional discipline.
- **Structural Lines:** Horizontal and vertical hairline rules are used to separate content, mimicking the layout of a luxury broadsheet or high-fashion lookbook.

## Components

### Buttons
- **Primary:** Cosmic Navy fill with Warm Ivory text. Sharp corners. 
- **Secondary:** Transparent fill with a 1px Cosmic Navy or Muted Gold border. 
- **Text Button:** Underlined typography with no background, used for low-priority navigation.

### Input Fields
- **Minimalist Frames:** Fields should only have a bottom border (1px) in light mode, becoming a full sharp box only on focus.
- **Focus State:** Border color transitions to Muted Gold.

### Cards
- **Editorial Cards:** No shadows. Defined by a change in background color (e.g., a Linen Grey box on a Warm Ivory page) and sharp edges.
- **Image Cards:** High-quality photography should fill the container entirely, with text overlays using Cosmic Navy or Warm Ivory depending on contrast.

### Specialized Components
- **The Logo:** The provided logo should be placed with significant clear space. On dark backgrounds, use the "Light" version; on Warm Ivory, use the "Dark" version.
- **Pagination:** Simple numerical indicators or "01 / 05" style counters to maintain the literary aesthetic.
- **Divider Lines:** 1px Muted Gold hairlines used to separate sections or define the top of the footer.