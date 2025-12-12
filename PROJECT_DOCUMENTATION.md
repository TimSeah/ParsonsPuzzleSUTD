# Project Documentation - Parsons Puzzle SUTD

## Table of Contents
- [Project Overview](#project-overview)
- [Architecture Overview](#architecture-overview)
- [Frontend Structure](#frontend-structure)
- [Backend Structure](#backend-structure)
- [Configuration Files](#configuration-files)
- [Data Management](#data-management)
- [Component System](#component-system)
- [Service Layer](#service-layer)
- [Development Workflow](#development-workflow)
- [Testing & Deployment](#testing--deployment)

---

## Project Overview

**Parsons Puzzle SUTD** is a modern, interactive web application designed to help students learn mathematical proofs through Parsons puzzles (drag-and-drop code/proof blocks). It serves SUTD 50.004 Algorithms students and provides both student learning interfaces and educator content creation tools.

### Key Features
- Interactive drag-and-drop proof construction
- LaTeX mathematical rendering with KaTeX
- Hybrid data system (JSON + MongoDB)
- Real-time puzzle validation
- Educator content management
- Responsive design with dark theme
- Server integration with graceful fallback

### Technology Stack
- **Frontend**: React 19.1, Vite 6.3.5, React Router 7.8
- **Backend**: Node.js, Express 4.18, MongoDB with Mongoose
- **UI Libraries**: @dnd-kit (drag-and-drop), KaTeX (math rendering), Lucide React (icons)
- **Development**: ESLint, Concurrently, Nodemon
- **Security**: Helmet, CORS, Express Rate Limit

---

## Architecture Overview

The application follows a full-stack architecture with clear separation of concerns:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    Database     │
│   React + Vite  │────│ Express + Node  │────│    MongoDB      │
│   Port 5173     │    │   Port 5000     │    │   Atlas/Local   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Data Flow Architecture
1. **Hybrid Data System**: JSON files provide default puzzles, MongoDB stores educator-created content
2. **Service Layer**: Unified API abstraction handles both local and server data
3. **State Management**: React hooks manage application state with loading/error handling
4. **Validation**: Client-side proof validation with detailed feedback system

---

## Frontend Structure

### Root Level Files

#### `/package.json`
**Purpose**: Frontend dependency management and build scripts
**Key Features**:
- Modern React 19.1 with latest ecosystem
- @dnd-kit for React 19 compatible drag-and-drop
- Concurrently for full-stack development
- Development and production build scripts

```json
{
  "scripts": {
    "dev": "vite",                                    // Frontend development
    "build": "vite build",                           // Production build
    "dev:fullstack": "concurrently \"npm run dev:server\" \"npm run dev\"", // Full stack development
    "dev:server": "cd server && npm run dev"        // Backend development
  }
}
```

#### `/vite.config.js`
**Purpose**: Vite build configuration
**Features**:
- React plugin integration
- Development server configuration
- Build optimization settings

#### `/index.html`
**Purpose**: Main HTML template
**Features**:
- SEO meta tags for educational content
- Theme color configuration
- Open Graph/Twitter card metadata
- KaTeX CSS import for mathematical rendering

#### `/.env`
**Purpose**: Frontend environment variables
**Configuration**:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Source Code Structure (`/src`)

#### `/src/main.jsx`
**Purpose**: React application entry point
**Functionality**:
- React 19 StrictMode setup
- KaTeX CSS import for mathematical rendering
- Root DOM mounting

#### `/src/App.jsx`
**Purpose**: Main application component and routing
**Features**:
- React Router setup with navigation
- Student/Educator page routing
- Unified navigation header
- Default route redirection to student page

#### `/src/App.css` & `/src/index.css`
**Purpose**: Global application styling
**Features**:
- Dark theme with GitHub-inspired design
- CSS custom properties for theming
- Responsive design utilities
- Mathematical content styling

### Page Components (`/src/pages`)

#### `/src/pages/StudentPage.jsx`
**Purpose**: Main student interface for solving puzzles
**Key Features**:
- Unified control panel integration
- Puzzle display with drag-and-drop
- Loading states and error handling
- Floating help button for guidance

**Dependencies**:
- `useAppState` hook for state management
- `PuzzleDisplay` for interactive solving
- `UnifiedControlPanel` for data source control
- UI components for loading and status

#### `/src/pages/EducatorPage.jsx`
**Purpose**: Educator dashboard for puzzle creation and management
**Key Features**:
- Statistics dashboard with async loading
- Category-based puzzle creation buttons
- Puzzle creation modal integration
- Success feedback with next action suggestions

**State Management**:
- Statistics loading and error handling
- Puzzle creation workflow management
- Success modal state management

**Integration**:
- `puzzleManagerService` for server communication
- `PuzzleCreator` component for puzzle creation
- `PuzzleSuccessModal` for completion feedback

### Component System (`/src/components`)

The component system is organized by functionality with clear separation of concerns:

#### UI Components (`/src/components/ui`)

**`DataSourceBadge.jsx`**
- **Purpose**: Visual indicator of current data source (API/Local)
- **Props**: `isUsingApi`, `puzzleCount`
- **Features**: Connection status display, puzzle count indicator

**`DataSourceToggle.jsx`**
- **Purpose**: Toggle between API and local data sources
- **Props**: `useLocalData`, `onToggle`, `isLoading`
- **Features**: Manual data source switching, loading states

**`ErrorTooltip.jsx`**
- **Purpose**: Error display with tooltip functionality
- **Props**: `error`, `show`
- **Features**: Graceful error presentation, conditional display

**`LoadingState.jsx`**
- **Purpose**: Consistent loading spinner component
- **Features**: Centered loading animation, semantic loading indication

**`PuzzleSelector.jsx`**
- **Purpose**: Dropdown for selecting puzzles
- **Props**: `puzzles`, `currentPuzzle`, `onPuzzleChange`
- **Features**: Puzzle navigation, category-aware display

**`StatusIndicator.jsx`**
- **Purpose**: General status indication component
- **Features**: Success/error/loading status visualization

#### Layout Components (`/src/components/layout`)

**`UnifiedControlPanel.jsx`**
- **Purpose**: Main control panel combining data source and puzzle controls
- **Props**: Complete application state props for data source management
- **Features**:
  - Data source badge and toggle integration
  - Puzzle selector integration
  - Error tooltip positioning
  - Responsive grid layout

**CSS Architecture**: Uses CSS Modules (`UnifiedControlPanel.module.css`) with:
- Grid-based responsive layout
- Interactive hover states
- GitHub-inspired design system
- Accessibility-focused styling

#### Puzzle Components (`/src/components/puzzle`)

**`PuzzleDisplay.jsx`**
- **Purpose**: Main puzzle solving interface
- **Features**:
  - Drag-and-drop proof block arrangement
  - LaTeX rendering for mathematical content
  - Interactive element handling (dropdowns, inputs)
  - Proof validation and feedback
  - Solution state management

**`ProofBlock.jsx`**
- **Purpose**: Individual proof statement blocks
- **Features**:
  - Drag-and-drop functionality with @dnd-kit
  - LaTeX rendering with interactive placeholders
  - Dropdown rendering for mathematical operators
  - Block highlighting and selection states

**`ProofValidationDisplay.jsx`**
- **Purpose**: Validation results and feedback display
- **Features**:
  - Detailed validation feedback
  - Score and progress indication
  - Error highlighting and suggestions

**`ValidatorDemo.jsx`**
- **Purpose**: Standalone validation testing component
- **Features**: Testing interface for proof validation logic

#### Renderer Components (`/src/components/renderers`)

**`KatexRenderer.jsx`**
- **Purpose**: LaTeX mathematical expression rendering
- **Features**:
  - KaTeX integration for math rendering
  - Interactive placeholder replacement
  - Error handling for invalid LaTeX
  - Caching for performance optimization

#### Educator Components (`/src/components/educator`)

**`PuzzleCreator.jsx`**
- **Purpose**: Complete puzzle creation interface
- **Features**:
  - Category-based puzzle creation
  - Drag-and-drop block ordering with @dnd-kit
  - LaTeX editor with live preview
  - Tag management system
  - Form validation and submission
  - Preview mode for student experience

**Component Architecture**:
- React 19 compatible drag-and-drop
- Sortable proof blocks with visual feedback
- Category-specific suggested tags
- Real-time LaTeX preview
- Comprehensive form validation

**`CustomTagInput.jsx`**
- **Purpose**: Flexible tag input component
- **Features**:
  - Suggested tags from category
  - Custom tag creation
  - Tag validation and deduplication
  - Keyboard navigation support

**`PuzzleSuccessModal.jsx`**
- **Purpose**: Success feedback after puzzle creation
- **Features**:
  - Success confirmation display
  - Next action suggestions
  - Modal state management
  - Clear user guidance

#### Navigation Components (`/src/components/navigation`)

**`NavigationHeader.jsx`**
- **Purpose**: Main application navigation
- **Features**:
  - Student/Educator page navigation
  - Active page highlighting
  - Responsive navigation design

### Hooks (`/src/hooks`)

#### `useAppState.js`
**Purpose**: Central application state management
**Features**:
- Puzzle data management (API vs local)
- Current puzzle state tracking
- Data source switching logic
- Loading and error state management

**State Properties**:
```javascript
{
  puzzles,              // Current puzzle array
  currentPuzzle,        // Selected puzzle object
  isUsingApi,           // Boolean: using API vs local
  useLocalData,         // User preference for data source
  isLoading,            // Loading state
  puzzlesError,         // Error state
  handlePuzzleChange,   // Puzzle selection handler
  handleNextPuzzle,     // Navigate to next puzzle
  toggleDataSource      // Switch between API/local
}
```

#### `usePuzzles.js`
**Purpose**: Puzzle data fetching with loading/error states
**Features**:
- API puzzle fetching
- Category-based filtering
- Pagination support
- Error handling and recovery
- Loading state management

**Hook Variants**:
- `usePuzzles(category, filters)` - Multiple puzzles
- `usePuzzle(puzzleId)` - Single puzzle
- `usePuzzleSearch()` - Search functionality
- `usePuzzleStats()` - Statistics data
- `useApiHealth()` - Health check

### Services (`/src/services`)

#### `puzzleService.js`
**Purpose**: Core API communication service
**Features**:
- RESTful API client for backend
- Request/response handling
- Error handling and retries
- Environment-based URL configuration

**Methods**:
```javascript
- getAllPuzzles(filters)     // GET /api/puzzles
- getPuzzleById(id)          // GET /api/puzzles/:id  
- createPuzzle(puzzle)       // POST /api/puzzles
- updatePuzzle(id, puzzle)   // PUT /api/puzzles/:id
- deletePuzzle(id)           // DELETE /api/puzzles/:id
- getStatistics()            // GET /api/puzzles/stats
- healthCheck()              // GET /api/health
```

#### `puzzleManagerService.js`
**Purpose**: High-level puzzle management for educators
**Features**:
- Server-first puzzle creation with localStorage fallback
- Statistics calculation and aggregation
- Puzzle validation and sanitization
- Export/import functionality

**Key Methods**:
```javascript
- savePuzzle(puzzle)         // Create puzzle with server integration
- getStatistics()            // Aggregate statistics from multiple sources
- validatePuzzle(puzzle)     // Comprehensive puzzle validation
- exportAllPuzzles()         // Export to JSON file
```

#### `hybridPuzzleService.js`
**Purpose**: Unified service combining JSON and server data
**Features**:
- Seamless integration of default (JSON) and created (MongoDB) puzzles
- Server availability detection
- Fallback mechanisms
- Source tracking and attribution

**Architecture**:
- JSON files provide immediate default content
- Server data adds educator-created puzzles
- Transparent failover on server unavailability
- Source information for debugging

#### `puzzleLoader.js`
**Purpose**: JSON-based puzzle loading service
**Features**:
- Static puzzle data loading
- Category-based organization
- Filtering and search capabilities
- Metadata extraction

### Utilities (`/src/utils`)

#### `ProofValidator.js`
**Purpose**: Proof validation logic and feedback generation
**Features**:
- Complete proof sequence validation
- Partial validation for hints
- Detailed feedback generation
- Score calculation algorithms
- Block-level error identification

**Validation Methods**:
```javascript
- validateProof(userOrder)     // Complete validation
- validatePartial(userOrder)   // Partial validation
- generateHint(userOrder)      // Hint generation
- calculateScore(userOrder)    // Score calculation
```

### Puzzle Data (`/src/puzzles`)

#### Legacy JavaScript Files
- `bigOProofs.js` - Big O notation puzzles
- `inductionProofs.js` - Mathematical induction puzzles  
- `recursionProofs.js` - Recursion and algorithm puzzles
- `setTheoryProofs.js` - Set theory puzzles

#### Modern JSON Data (`/src/puzzles/data`)
- `big-o-proofs.json` - Structured Big O puzzles
- `induction-proofs.json` - Mathematical induction puzzles
- `recursion-proofs.json` - Recursion puzzles
- `set-theory-proofs.json` - Set theory puzzles

**JSON Structure**:
```json
{
  "category": "Category Name",
  "description": "Category description",
  "puzzles": [
    {
      "id": "unique-id",
      "title": "LaTeX title",
      "displayTitle": "Plain text title",
      "statement": "Proof statement",
      "difficulty": "easy|medium|hard",
      "tags": ["tag1", "tag2"],
      "blocks": [
        {
          "id": "block-id",
          "latex": "LaTeX content with {{placeholders}}"
        }
      ],
      "solutionOrder": ["block1", "block2", ...]
    }
  ]
}
```

### Styling (`/src/styles`)

#### `shared.css`
**Purpose**: Shared styling utilities and variables
**Features**:
- CSS custom properties for theming
- Common utility classes
- Responsive breakpoints
- Mathematical content styling

---

## Backend Structure

### Root Level Files (`/server`)

#### `/server/package.json`
**Purpose**: Backend dependency management
**Key Dependencies**:
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin resource sharing
- `helmet` - Security middleware
- `express-rate-limit` - Rate limiting
- `dotenv` - Environment variables

**Scripts**:
```json
{
  "start": "node server.js",           // Production server
  "dev": "nodemon server.js",          // Development with auto-restart
  "migrate": "node scripts/migratePuzzles.js" // Data migration
}
```

#### `/server/server.js`
**Purpose**: Main server application file
**Features**:
- Express server configuration
- MongoDB connection with Mongoose
- Security middleware (Helmet, CORS, Rate Limiting)
- Route mounting and error handling
- Environment-based configuration

**Security Configuration**:
```javascript
// Rate limiting: 100 requests per 15 minutes
// CORS: Development and production origins
// Helmet: Security headers
// JSON parsing: 10MB limit for large puzzles
```

### Data Models (`/server/models`)

#### `Puzzle.js`
**Purpose**: MongoDB schema definition for puzzles
**Schema Structure**:
```javascript
{
  id: String (unique, indexed),
  title: String (LaTeX format),
  displayTitle: String (plain text),
  statement: String (proof statement),
  category: Enum ['big-o', 'induction', 'set-theory', 'recursion'],
  difficulty: Enum ['easy', 'medium', 'hard'],
  blocks: [{ id: String, latex: String }],
  solutionOrder: [String],
  tags: [String],
  isActive: Boolean (default: true),
  createdBy: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

**Indexes**:
- `id` - Unique identifier
- `category` - Category-based queries
- `isActive` - Active puzzle filtering

### API Routes (`/server/routes`)

#### `puzzles.js`
**Purpose**: RESTful API endpoints for puzzle management

**Endpoints**:

**GET /api/puzzles**
- Purpose: Retrieve all puzzles with filtering
- Query Parameters:
  - `category` - Filter by category
  - `difficulty` - Filter by difficulty
  - `tags` - Filter by tags (comma-separated)
  - `search` - Full-text search
  - `limit` - Results per page (default: 50)
  - `offset` - Pagination offset (default: 0)
- Response: Paginated puzzle list with metadata

**POST /api/puzzles**
- Purpose: Create new puzzle
- Body: Complete puzzle object
- Validation: Required fields and data types
- Response: Created puzzle object

**GET /api/puzzles/:id**
- Purpose: Retrieve specific puzzle by ID
- Response: Single puzzle object or 404

**PUT /api/puzzles/:id**
- Purpose: Update existing puzzle
- Body: Updated puzzle data
- Response: Updated puzzle object

**DELETE /api/puzzles/:id**
- Purpose: Soft delete puzzle (sets isActive: false)
- Response: Success confirmation

**GET /api/puzzles/stats/summary**
- Purpose: Aggregate statistics
- Response: Total counts, category breakdown, difficulty distribution

### Database Scripts (`/server/scripts`)

#### `migratePuzzles.js`
**Purpose**: Data migration utility for initial setup
**Features**:
- Import JSON puzzle data to MongoDB
- Duplicate detection and handling
- Progress reporting
- Error handling and rollback

**Usage**:
```bash
cd server
npm run migrate
```

### Configuration Files

#### `/server/.env` (Not in repo - see .env.example)
**Purpose**: Server environment configuration
```env
MONGODB_URI=mongodb+srv://...    # MongoDB connection string
PORT=5000                        # Server port
NODE_ENV=development             # Environment mode
FRONTEND_URL=http://localhost:5173  # CORS configuration
```

---

## Configuration Files

### ESLint Configuration (`eslint.config.js`)
**Purpose**: Code quality and style enforcement
**Features**:
- Separate configurations for frontend and backend
- React-specific rules and hooks
- Node.js backend rules
- Unused variable detection
- JSX and modern JavaScript support

### Git Configuration (`.gitignore`)
**Purpose**: Version control exclusions
**Exclusions**:
- Node modules (both root and server)
- Build outputs (dist, build)
- Environment files (.env, *.local)
- Logs and runtime files
- Editor configurations
- OS-specific files

### Vite Configuration (`vite.config.js`)
**Purpose**: Build tool configuration
**Features**:
- React plugin integration
- Development server configuration
- Build optimization
- Asset handling

---

## Data Management

### Hybrid Data Architecture

The application uses a sophisticated hybrid approach:

1. **Default Content (JSON Files)**:
   - Immediate availability
   - Version controlled
   - Curated educational content
   - Fallback when server unavailable

2. **Dynamic Content (MongoDB)**:
   - Educator-created puzzles
   - Real-time availability
   - Persistent storage
   - Advanced querying

3. **Service Layer Integration**:
   - Transparent data source switching
   - Source attribution
   - Fallback mechanisms
   - Performance optimization

### Data Flow

```
JSON Files ──┐
             ├──→ Hybrid Service ──→ React Components
MongoDB   ───┘
```

### Puzzle Data Structure

Each puzzle contains:
- **Identification**: Unique ID, category, difficulty
- **Content**: LaTeX title, display title, statement
- **Proof Blocks**: Ordered array with LaTeX content and interactive placeholders
- **Solution**: Correct block ordering
- **Metadata**: Tags, creation info, activity status

### Interactive Placeholders

The system supports dynamic content through placeholders:
- `{{complexity}}` - O, Ω, Θ notation dropdown
- `{{op}}` - Mathematical operators (≤, ≥, =, ≠)
- `{{quantifier}}` - Logic quantifiers (∀, ∃)
- `{{logic}}` - Logic operators (∧, ∨)
- `{{setop}}` - Set operations (∈, ⊆, ∪, ∩)

---

## Component System

### Design Principles

1. **Separation of Concerns**: Clear boundaries between UI, logic, and data
2. **Reusability**: Components designed for multiple contexts
3. **Accessibility**: ARIA labels, keyboard navigation, screen reader support
4. **Responsive Design**: Mobile-first approach with flexible layouts
5. **Error Handling**: Graceful degradation and user feedback

### Component Communication

```
App.jsx
├── Pages (StudentPage, EducatorPage)
│   ├── Layout Components (UnifiedControlPanel)
│   ├── UI Components (LoadingState, ErrorTooltip)
│   └── Feature Components (PuzzleDisplay, PuzzleCreator)
└── Services (Data management and API calls)
```

### State Management Strategy

- **Local State**: Component-specific UI state
- **Custom Hooks**: Shared logic and data fetching
- **Context**: Not used - kept simple with prop drilling
- **Services**: External state management for data persistence

---

## Service Layer

### Architecture

The service layer provides abstraction between components and data sources:

```
Components ──→ Hooks ──→ Services ──→ Data Sources
```

### Service Responsibilities

1. **Data Fetching**: API calls and local data access
2. **State Management**: Loading, error, and success states
3. **Caching**: Performance optimization
4. **Error Handling**: Graceful failure and recovery
5. **Data Transformation**: API response to component format

### Service Integration

- Services are stateless and functional
- Hooks provide React integration
- Components consume through hooks only
- Clear error boundaries at each level

---

## Development Workflow

### Setup Process

1. **Environment Setup**:
   ```bash
   # Clone repository
   git clone https://github.com/lolkabash/ParsonsPuzzleSUTD.git
   cd ParsonsPuzzleSUTD
   
   # Install dependencies
   npm install
   cd server && npm install && cd ..
   
   # Configure environment
   cp server/.env.example server/.env
   # Edit server/.env with MongoDB URI
   ```

2. **Database Setup**:
   ```bash
   # Start MongoDB (local) or configure Atlas
   cd server
   npm run migrate  # Import initial puzzle data
   ```

3. **Development Server**:
   ```bash
   # Full stack development
   npm run dev:fullstack
   
   # Or separately
   npm run dev         # Frontend (port 5173)
   cd server && npm run dev  # Backend (port 5000)
   ```

### Development Commands

```bash
# Frontend Development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend Development  
cd server
npm run dev          # Development with nodemon
npm start            # Production server
npm run migrate      # Data migration

# Full Stack
npm run dev:fullstack # Both servers concurrently
```

### File Structure Best Practices

1. **Component Files**: 
   - `ComponentName.jsx` - React component
   - `ComponentName.module.css` - Scoped styles
   - `index.js` - Export aggregation

2. **Service Files**:
   - Lowercase filename with descriptive name
   - Single responsibility principle
   - Clear API documentation in comments

3. **Hook Files**:
   - `use` prefix for custom hooks
   - Focused on single piece of state/logic
   - Reusable across components

### Code Quality Standards

- **ESLint**: Enforced code style and quality
- **React Hooks Rules**: Proper hook usage patterns
- **CSS Modules**: Scoped styling to prevent conflicts
- **Error Boundaries**: Proper error handling at component boundaries

---

## Testing & Deployment

### Testing Strategy

1. **Manual Testing**:
   - Educator puzzle creation workflow
   - Student puzzle solving experience
   - Data source switching functionality
   - Mobile responsiveness

2. **Integration Testing**:
   - Frontend-backend API integration
   - Database migration and data integrity
   - Error handling and fallback mechanisms

3. **Sample Data**: 
   - `SAMPLE.md` provides comprehensive test scenarios
   - Multiple categories and difficulty levels
   - LaTeX rendering validation

### Production Deployment

#### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to static hosting (Vercel, Netlify, etc.)
# Build output in 'dist' directory
```

#### Backend Deployment
```bash
# Prepare for production
cd server
npm install --production

# Set environment variables on hosting platform
# MONGODB_URI, NODE_ENV=production, PORT, FRONTEND_URL

# Deploy to cloud service (Heroku, Railway, etc.)
```

#### Database Setup
- **Production**: MongoDB Atlas cluster
- **Connection**: Update MONGODB_URI in production environment
- **Migration**: Run migration script in production environment

### Environment Configuration

**Development**:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Database: Local MongoDB or Atlas

**Production**:
- Frontend: Static hosting with CDN
- Backend: Cloud hosting with environment variables
- Database: MongoDB Atlas with proper security

### Monitoring and Maintenance

1. **Logging**: Server request/error logging
2. **Performance**: Monitor bundle size and load times
3. **Database**: Index optimization and query performance
4. **Security**: Regular dependency updates and security reviews

---

## File Index and Purpose

### Root Level
- `package.json` - Frontend dependencies and scripts
- `vite.config.js` - Vite build configuration
- `eslint.config.js` - Code quality configuration
- `index.html` - HTML template with meta tags
- `.env` - Frontend environment variables
- `.gitignore` - Git exclusion patterns
- `README.md` - Main project documentation
- `SAMPLE.md` - Test puzzle examples

### Frontend (`/src`)
- `main.jsx` - React application entry point
- `App.jsx` - Main application component and routing
- `App.css` - Global application styles
- `index.css` - Base CSS styles

### Pages (`/src/pages`)
- `StudentPage.jsx` - Student puzzle solving interface
- `EducatorPage.jsx` - Educator dashboard and management
- `StudentPage.module.css` - Student page styling
- `EducatorPage.module.css` - Educator page styling
- `index.js` - Page component exports

### Components (`/src/components`)
- `index.js` - Main component export aggregation
- `README.md` - Component organization documentation

### UI Components (`/src/components/ui`)
- `DataSourceBadge.jsx` - Connection status indicator
- `DataSourceToggle.jsx` - Data source switcher
- `ErrorTooltip.jsx` - Error display component
- `LoadingState.jsx` - Loading spinner component
- `PuzzleSelector.jsx` - Puzzle selection dropdown
- `StatusIndicator.jsx` - General status indicator
- CSS Modules for each component
- `index.js` - UI component exports

### Layout Components (`/src/components/layout`)
- `UnifiedControlPanel.jsx` - Main application control panel
- `UnifiedControlPanel.module.css` - Control panel styling
- `index.js` - Layout component exports

### Puzzle Components (`/src/components/puzzle`)
- `PuzzleDisplay.jsx` - Main puzzle solving interface
- `ProofBlock.jsx` - Individual proof block component
- `ProofValidationDisplay.jsx` - Validation feedback display
- `ValidatorDemo.jsx` - Validation testing component
- CSS files for styling
- `index.js` - Puzzle component exports

### Renderer Components (`/src/components/renderers`)
- `KatexRenderer.jsx` - LaTeX mathematical rendering
- `index.js` - Renderer component exports

### Educator Components (`/src/components/educator`)
- `PuzzleCreator.jsx` - Complete puzzle creation interface
- `CustomTagInput.jsx` - Tag input component
- `PuzzleSuccessModal.jsx` - Success feedback modal
- CSS Modules for styling
- `index.js` - Educator component exports

### Navigation Components (`/src/components/navigation`)
- `NavigationHeader.jsx` - Main application navigation
- `index.js` - Navigation component exports

### Hooks (`/src/hooks`)
- `useAppState.js` - Central application state management
- `usePuzzles.js` - Puzzle data fetching hooks

### Services (`/src/services`)
- `puzzleService.js` - Core API communication service
- `puzzleManagerService.js` - High-level puzzle management
- `hybridPuzzleService.js` - Unified JSON/server data service
- `puzzleLoader.js` - JSON-based puzzle loading service

### Utilities (`/src/utils`)
- `ProofValidator.js` - Proof validation logic and feedback

### Puzzle Data (`/src/puzzles`)
- `index.js` - Puzzle export aggregation
- Legacy JavaScript files (bigOProofs.js, etc.)
- `/data/` - Modern JSON puzzle files

### Styles (`/src/styles`)
- `shared.css` - Shared styling utilities

### Backend (`/server`)
- `server.js` - Main server application
- `package.json` - Backend dependencies and scripts
- `README.md` - Backend documentation
- `.env.example` - Environment template

### Models (`/server/models`)
- `Puzzle.js` - MongoDB puzzle schema

### Routes (`/server/routes`)
- `puzzles.js` - RESTful API endpoints

### Scripts (`/server/scripts`)
- `migratePuzzles.js` - Database migration utility

### Documentation (`/guides`)
- `DEVELOPMENT.md` - Development setup guide
- `MIGRATION_GUIDE.md` - MongoDB Atlas migration guide
- `JSON_MIGRATION_GUIDE.md` - JavaScript to JSON migration guide
- `EDUCATOR_GUIDE.md` - Educator usage documentation