# Component Organization

This folder contains all React components organized by their purpose and functionality.

## Folder Structure

### `/ui`
Basic UI components that can be reused across the application:
- `DataSourceBadge` - Badge showing current data source status
- `DataSourceToggle` - Toggle button for switching data sources
- `ErrorTooltip` - Error display with tooltip functionality
- `LoadingState` - Loading state component with spinner
- `PuzzleSelector` - Dropdown for selecting puzzles

### `/puzzle`
Components specifically related to puzzle functionality:
- `PuzzleDisplay` - Main puzzle display with drag-and-drop
- `ProofBlock` - Individual proof statement blocks
- `ProofValidationDisplay` - Shows validation results and feedback
- `ValidatorDemo` - Demo component for testing validation

### `/layout`
Components that handle page layout and structure:
- `UnifiedControlPanel` - Main control panel combining data source and puzzle controls

### `/renderers`
Specialized rendering components:
- `KatexRenderer` - LaTeX mathematical expression renderer

## Usage

Components can be imported in several ways:

```javascript
// Import specific components
import { PuzzleDisplay, LoadingState } from './components';

// Import from specific category
import { DataSourceBadge, ErrorTooltip } from './components/ui';

// Direct import (less preferred)
import PuzzleDisplay from './components/puzzle/PuzzleDisplay';
```

## CSS Modules

Each component that uses CSS modules has its styles co-located in the same folder:
- Component: `ComponentName.jsx`
- Styles: `ComponentName.module.css`

Legacy CSS files (`.css`) are also maintained for components that haven't been migrated to CSS modules yet.
