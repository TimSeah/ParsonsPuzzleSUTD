# Component Organization

This folder contains all React components organized by their purpose and functionality. Tests live next to the component they cover (`ComponentName.test.jsx`).

## Folder Structure

### `/ui`
Basic UI components that can be reused across the application (shared classes such as `.btn`, `.card`, `.segmented`, `.chip` and `.notice` live in `src/styles/ui.css`):
- `Dialog` - Accessible modal dialog; `variant="sheet"` docks to the bottom on mobile
- `ErrorTooltip` - Error display with tooltip functionality
- `LoadingState` - Loading state with spinner (`size="small"` for an inline spinner)
- `StatusIndicator` - Online / offline / connecting status pill
- `DictionaryModal` - Searchable notation dictionary, opened from the header
- `ThemeToggle` - Light/dark theme icon button used in the header

### `/puzzle`
Components specifically related to puzzle functionality:
- `PuzzleDisplay` - Puzzle board (drag and drop plus tap-to-place), practice mode and challenge modes
- `ProofBlock` - Individual proof statement blocks
- `ProofValidationDisplay` - Shows validation results and feedback (practice mode)

### `/layout`
Components that handle page layout and structure:
- `PuzzleSettings` - Puzzle source, difficulty and topic settings (desktop side panel / mobile bottom sheet)

### `/navigation`
- `NavigationHeader` - App header (brand, Student/Educator links, Feedback, dictionary, theme) and the mobile bottom tab bar

### `/educator`
Components for the educator puzzle-creation workflow.

### `/renderers`
Specialized rendering components:
- `KatexRenderer` - Renders bundled LaTeX puzzles and generated prose with delimited math, including interactive dropdown placeholders

## Usage

Components can be imported in several ways:

```javascript
// Import specific components
import { PuzzleDisplay, LoadingState } from './components';

// Import from specific category
import { ErrorTooltip } from './components/ui';

// Direct import (less preferred)
import PuzzleDisplay from './components/puzzle/PuzzleDisplay';
```

## CSS Modules

Each component that uses CSS modules has its styles co-located in the same folder:
- Component: `ComponentName.jsx`
- Styles: `ComponentName.module.css`

Legacy CSS files (`.css`) are also maintained for components that haven't been migrated to CSS modules yet.

## Theming

Light and dark themes are driven by the `--color-*` tokens defined in `src/index.css` (`:root[data-theme="light"]` / `:root[data-theme="dark"]`); `useTheme` sets `data-theme` on `<html>`. Use these tokens, for example `var(--color-fg-default)`, `var(--color-canvas-subtle)`, `var(--color-accent-subtle)` or `var(--color-danger-fg)`, instead of hard-coded colours so components stay readable in both themes.
