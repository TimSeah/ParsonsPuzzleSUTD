# Style Guide and CSS Documentation

This document outlines the styling conventions and CSS architecture for the Parson's Puzzle application.

## CSS Architecture

The application uses a modular CSS architecture with component-specific stylesheets:

- `App.css` - Global application styles and layout
- `PuzzleDisplay.css` - Main puzzle interface styling
- `ProofValidationDisplay.css` - Validation feedback styling
- `ProofBlock.css` - Individual block styling
- `index.css` - Base styles and CSS reset

## Design System

### Color Palette

```css
/* Primary Colors */
--primary-blue: #2196F3;
--primary-dark: #1976D2;
--primary-light: #BBDEFB;

/* Success/Error States */
--success-green: #4CAF50;
--warning-amber: #FFC107;
--warning-orange: #FF9800;
--error-red: #F44336;

/* Neutral Colors */
--background-light: #FAFAFA;
--surface-white: #FFFFFF;
--text-primary: #212121;
--text-secondary: #757575;
--divider-light: #E0E0E0;
```

### Typography

```css
/* Font Stack */
font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;

/* Text Sizes */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
```

### Spacing System

```css
/* Spacing Scale */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

## Component Styling Conventions

### Drag and Drop Interface

- Visual feedback during drag operations
- Clear drop zones with visual indicators
- Smooth transitions and animations
- Accessibility considerations for keyboard navigation

### Mathematical Notation

- KaTeX integration for LaTeX rendering
- Consistent mathematical typography
- Proper spacing and alignment
- Fallback styles for rendering errors

### Validation Feedback

- Color-coded scoring system
- Progressive disclosure for hints
- Clear visual hierarchy
- Responsive design for different screen sizes

## Responsive Design

The application follows a mobile-first approach with breakpoints:

```css
/* Mobile First */
@media (min-width: 768px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
}
```

## Accessibility

- High contrast ratios for text (WCAG 2.1 AA)
- Focus indicators for keyboard navigation
- Screen reader friendly markup
- Semantic HTML structure

## CSS Best Practices

1. **Use semantic class names** that describe content, not appearance
2. **Follow BEM methodology** for consistent naming
3. **Minimize specificity** to avoid CSS conflicts
4. **Use CSS custom properties** for theming and consistency
5. **Prefer flexbox and grid** for layouts
6. **Write mobile-first responsive styles**

## Animation and Transitions

```css
/* Standard transition timing */
transition: all 0.2s ease-in-out;

/* Drag and drop animations */
transform: translateY(0);
transition: transform 0.2s ease;

/* Loading states */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Browser Support

The application targets modern browsers with support for:

- CSS Grid and Flexbox
- CSS Custom Properties
- ES6+ JavaScript features
- Modern HTML5 APIs
