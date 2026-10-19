# Component Organization

This folder contains all React components organized by their purpose and functionality. Tests live next to the component they cover (`ComponentName.test.jsx`).

## Folder Structure

### `/ui`
Basic UI components that can be reused across the application:
- `ErrorTooltip` - Error display with tooltip functionality
- `LoadingState` - Loading state component with spinner
- `StatusIndicator` - Shows whether puzzles come from the API or the bundled data
- `FloatingHelpButton` / `DictionaryModal` - Help button that opens the notation dictionary
- `ThemeToggle` - Light/dark theme switch used in the navigation header

### `/puzzle`
Components specifically related to puzzle functionality:
- `PuzzleDisplay` - Main puzzle display with drag-and-drop, practice mode and challenge modes
- `ProofBlock` - Individual proof statement blocks
- `ProofValidationDisplay` - Shows validation results and feedback (practice mode)

### `/layout`
Components that handle page layout and structure:
- `LeftControlPanel` - Student control panel: generate button, data source, difficulty and proof-type filters

### `/navigation`
- `NavigationHeader` - Top navigation with student/educator tabs, theme toggle and feedback link

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
