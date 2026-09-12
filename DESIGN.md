---
name: D:CODE
description: Professional Dark Mode competitive coding arena — refined, restrained, every pixel earns its place
colors:
  neutral-void: "#09090b"
  neutral-base: "#0c0c0e"
  neutral-surface: "#111113"
  neutral-elevated: "#18181b"
  neutral-border: "#27272a"
  neutral-border-subtle: "#1e1e22"
  neutral-text-primary: "#fafafa"
  neutral-text-secondary: "#a1a1aa"
  neutral-text-tertiary: "#71717a"
  accent-violet: "#8b5cf6"
  accent-violet-muted: "#7c3aed"
  accent-violet-subtle: "rgba(139, 92, 246, 0.12)"
  accent-violet-border: "rgba(139, 92, 246, 0.25)"
  status-success: "#22c55e"
  status-success-subtle: "rgba(34, 197, 94, 0.12)"
  status-warning: "#f59e0b"
  status-warning-subtle: "rgba(245, 158, 11, 0.12)"
  status-danger: "#ef4444"
  status-danger-subtle: "rgba(239, 68, 68, 0.12)"
  status-info: "#3b82f6"
  status-info-subtle: "rgba(59, 130, 246, 0.12)"
typography:
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.01em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.accent-violet}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.accent-violet-muted}"
    textColor: "#ffffff"
  button-secondary:
    backgroundColor: "{colors.neutral-elevated}"
    textColor: "{colors.neutral-text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-text-secondary}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-elevated:
    backgroundColor: "{colors.neutral-elevated}"
    textColor: "{colors.neutral-text-primary}"
    rounded: "{rounded.lg}"
    padding: "20px"
  input:
    backgroundColor: "{colors.neutral-base}"
    textColor: "{colors.neutral-text-primary}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
---

# Design System: D:CODE

## Overview

**Creative North Star: "The Arena"**

D:CODE's design language is a competitive arena built for developers — dark, precise, and unapologetically functional. Every element earns its place through utility, not decoration. The system draws from the discipline of Linear's precision and GitHub's restraint, establishing a world where the interface disappears and the code, the competition, and the community take center stage.

The palette is intentionally muted: deep neutral backgrounds with a single, controlled violet accent that signals action and status without ever shouting. Typography is clear and hierarchical — Plus Jakarta Sans for interface text, JetBrains Mono for code and data. Shadows are structural, not decorative. Borders define surfaces, not ornament them. This is a tool that respects its user's attention.

**Key Characteristics:**
- Deep, near-black neutral backgrounds with minimal tonal variation
- Single accent (muted violet) used sparingly — rarity creates signal
- Structural elevation through subtle borders and offset shadows
- Typography-first hierarchy: weight and size do the work, not color
- Every interactive element has clear, restrained hover and focus states

## Colors

The palette is built on deep zinc neutrals with a single muted violet accent. Status colors are functional, never decorative.

### Primary
- **Arena Violet** (#8b5cf6): The sole accent color. Used for interactive elements (buttons, links, active states), progress indicators, and the primary call-to-action. Its restraint is the point — it appears on ≤15% of any given screen.

### Neutral
- **Void** (#09090b): The deepest background — page body, outermost container. Near-black with zero warmth.
- **Base** (#0c0c0e): Slightly lifted surface — inputs, code blocks, inner containers that need subtle separation from Void.
- **Surface** (#111113): Card backgrounds, sidebar, panels. The workhorse surface — present on most visible elements.
- **Elevated** (#18181b): Hover states, dropdowns, modals, elements that float above Surface. One step warmer than Surface.
- **Border** (#27272a): Structural borders — cards, dividers, input edges. Visible but never competing.
- **Border Subtle** (#1e1e22): Hairline dividers, internal card separators. Present only on close inspection.
- **Text Primary** (#fafafa): Headings, primary content, active labels. Near-white.
- **Text Secondary** (#a1a1aa): Body copy, descriptions, inactive labels. 60% white.
- **Text Tertiary** (#71717a): Placeholders, metadata, disabled text. 45% white.

### Status
- **Success** (#22c55e): Correct answers, positive outcomes, online indicators. Always paired with a subtle green background tint.
- **Warning** (#f59e0b): Caution states, pending actions, time running low. Paired with amber background tint.
- **Danger** (#ef4444): Errors, failures, destructive actions, losses. Paired with red background tint.
- **Info** (#3b82f6): Neutral notifications, informational badges. Paired with blue background tint.

### Named Rules

**The Rarity Rule.** Arena Violet appears on ≤15% of any given screen. Its scarcity creates signal; when everything is violet, nothing is.

**The Neutral-Dominant Rule.** At least 70% of any visible surface is neutral (Void through Elevated). Color exists to inform, not to decorate.

## Typography

**Display/Body Font:** Plus Jakarta Sans (with system-ui, sans-serif fallback)
**Code/Data Font:** JetBrains Mono (with ui-monospace, monospace fallback)

**Character:** Plus Jakarta Sans is geometric with soft terminals — professional without being cold. It reads clearly at small sizes and holds weight at display scale. JetBrains Mono is the functional partner for code, data, and measurements.

### Hierarchy
- **Display** (800 weight, clamp(1.5rem, 4vw, 2.25rem), 1.1 line-height, -0.025em tracking): Page titles, hero headings. Appears once per view maximum.
- **Headline** (700 weight, 1.25rem, 1.25 line-height, -0.02em tracking): Section headings, card titles. Clear hierarchy break from display.
- **Title** (600 weight, 1rem, 1.4 line-height): Subsection headers, list item titles, table headers.
- **Body** (400 weight, 0.875rem, 1.6 line-height): Paragraphs, descriptions, primary content. Max line length 65–75ch where practical.
- **Label** (600 weight, 0.75rem, 1.4 line-height, 0.01em tracking): Buttons, badges, navigation items, metadata.
- **Mono** (500 weight, 0.8125rem, 1.5 line-height): Code blocks, inline code, data values, status indicators, timestamps.

### Named Rules

**The Weight-Does-Work Rule.** Hierarchy is established through font-weight contrast, not color or size alone. A 700-weight heading on a neutral background needs no accent color to read as important.

**The Mono-For-Data Rule.** Monospace font is reserved for code, numerical data, and timestamps. Never use it for UI labels, headings, or prose — that's costume, not craft.

## Layout

The grid is fluid with a max-width container of 1240px, centered with auto margins. Spacing follows a consistent rhythm: sections separated by 24–32px, items within sections by 16px, tight groups by 8–12px.

**Density:** Medium density — generous enough to breathe, tight enough to scan quickly. No wasted whitespace, but never cramped.

**Responsive breakpoints:**
- Mobile: single column, sidebar collapses to hamburger overlay
- Tablet (768px+): two-column layouts emerge, stat cards go 2-col
- Desktop (1024px+): full sidebar, 3-4 column grids, multi-panel duel workspace
- Wide (1440px+): max-width container, no layout changes

**Spacing rhythm:** More space above a heading than below it. Sections have clear visual separation (24–32px); items within sections flow tightly (8–16px).

## Elevation & Depth

Elevation is conveyed through **structural borders and offset shadows**, not through color or blur alone. The system is intentionally flat at rest — shadows appear on interaction and elevation.

### Shadow Vocabulary
- **Surface** (`box-shadow: 0 1px 2px rgba(0,0,0,0.3)`): Default state for cards and surfaces. Ambient, not visible at a glance.
- **Elevated** (`box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)`): Hover states, dropdowns, floating elements. Visible structural offset.
- **Modal** (`box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.3)`): Modals, dialogs, overlays. Dramatic depth separation.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, active, focus) or elevation (modal, dropdown). A resting card never casts a visible shadow.

**The Border-First Rule.** Surfaces are defined by borders first, shadows second. A 1px border on `#27272a` does more structural work than any shadow.

## Shapes

The form language is clean and consistent: rounded corners at three scales, no sharp edges, no ornamental clipping.

- **Sm** (6px): Buttons, inputs, badges, small interactive elements
- **Md** (8px): Cards, containers, panels, medium-sized surfaces
- **Lg** (12px): Large cards, modals, hero sections
- **Xl**16px): Feature cards, prominent containers

**Borders:** 1px solid on `#27272a` for structural separation. Never thicker. Border color shifts to `#3f3f46` on hover for interactive elements.

## Components

### Buttons
- **Shape:** 6px radius, 10px 20px padding, 0.75rem font-size, 600 weight
- **Primary:** Violet background (#8b5cf6), white text. Hover deepens to #7c3aed, 150ms ease-out. Focus ring: 2px offset outline in violet.
- **Secondary:** Elevated background (#18181b), primary text. Border shifts to #3f3f46 on hover.
- **Ghost:** Transparent background, secondary text. Hover shows elevated background.
- **Danger:** Rose background, white text. Used only for destructive confirmation actions.

### Cards
- **Corner Style:** 12px radius
- **Background:** Surface (#111113) for resting, Elevated (#18181b) for interactive
- **Shadow Strategy:** Flat-by-default; elevated shadow on hover
- **Border:** 1px solid #27272a, shifts to #3f3f46 on hover
- **Internal Padding:** 20px (standard), 16px (compact), 24px (spacious)

### Inputs
- **Style:** Base background (#0c0c0e), 1px border on #27272a, 8px radius
- **Focus:** Border shifts to violet (#8b5cf6), subtle violet ring (2px offset, 12% opacity)
- **Placeholder:** Tertiary text (#71717a)
- **Error:** Border shifts to danger (#ef4444), error message in danger color
- **Disabled:** Reduced opacity (0.5), no pointer events

### Navigation (Sidebar)
- **Style:** Surface background, full-height, 240px expanded / 64px collapsed
- **Typography:** Label weight (600), 0.875rem
- **Default:** Tertiary text (#71717a), transparent background
- **Hover:** Secondary text (#a1a1aa), Elevated background (#18181b)
- **Active:** Primary text (#fafafa), Elevated background, left border accent in violet
- **Transition:** 150ms ease-out on background and color

### Tables
- **Style:** Surface background, border-first structure
- **Header:** Label weight, uppercase tracking, tertiary text
- **Rows:** Hover shows Elevated background, border-bottom on Border Subtle
- **Cells:** Body weight, primary text for main content, secondary for metadata
- **Sortable columns:** Hover shows cursor pointer, sort icon appears

### Badges/Chips
- **Style:** 6px radius, Label weight, uppercase tracking
- **Difficulty:** Emerald (Easy), Amber (Medium), Rose (Hard) — each with matching subtle background tint
- **Status:** Success/Warning/Danger with subtle background
- **Rank:** Violet for current user, neutral for others

### Tabs
- **Style:** Border-bottom on inactive, 2px bottom border on active
- **Inactive:** Tertiary text, no background
- **Active:** Primary text, violet bottom border, Label weight
- **Hover:** Secondary text transition

## Do's and Don'ts

### Do:
- **Do** use borders as the primary structural element — they define surfaces more reliably than shadows
- **Do** keep violet under 15% of screen real estate — its rarity creates signal
- **Do** use font-weight contrast (600 vs 400) to establish hierarchy, not color
- **Do** keep code and data in JetBrains Mono — it's functional, not decorative
- **Do** ensure all text meets 4.5:1 contrast ratio against its background
- **Do** use consistent 8px spacing grid for all layout decisions

### Don't:
- **Don't** use gradient text — emphasis comes from weight or size, not color shifts
- **Don't** apply glass/blur as decoration — reserve backdrop-filter for specific overlay effects only
- **Don't** use hard offset shadows (4px 4px 0) — they belong to neobrutalist worlds, not this one
- **Don't** use monospace font for UI labels, headings, or prose — it's for code and data only
- **Don't** add decorative borders (colored left/right borders on cards) — borders are structural
- **Don't** use violet for large backgrounds — it's an accent, not a surface color
