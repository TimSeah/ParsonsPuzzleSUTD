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

### Repository root

The root `package.json` holds repo-level scripts (`setup`, `dev`, `dev:fullstack`, `test`, `lint`) and the shared ESLint tooling. `eslint.config.js` lints all three packages. Each app has its own `package.json` and lockfile.

### Frontend package (`/frontend`)

#### `/frontend/package.json`
**Purpose**: Frontend dependency management and build scripts
**Key Features**:
- Modern React 19.1 with latest ecosystem
- @dnd-kit for React 19 compatible drag-and-drop
- Vitest + React Testing Library for tests

```json
{
  "scripts": {
    "dev": "vite",            // Frontend development (npm run dev from the root)
    "build": "vite build",    // Production build into frontend/dist
    "test": "vitest run"      // Frontend tests (npm run test:frontend from the root)
  }
}
```

#### `/frontend/vite.config.js`
**Purpose**: Vite build configuration
**Features**:
- React plugin integration
- Development server configuration
- Build optimization settings

#### `/frontend/index.html`
**Purpose**: Main HTML template
**Features**:
- SEO meta tags for educational content
- Theme color configuration
- Open Graph/Twitter card metadata
- KaTeX CSS import for mathematical rendering

#### `/frontend/.env`
**Purpose**: Frontend environment variables (copy from `/frontend/.env.example`)
**Configuration**:
```
VITE_API_BASE_URL=http://localhost:5001/api
```

### Source Code Structure (`/frontend/src`)

#### `/frontend/src/main.jsx`
**Purpose**: React application entry point
**Functionality**:
- React 19 StrictMode setup
- KaTeX CSS import for mathematical rendering
- Root DOM mounting

#### `/frontend/src/App.jsx`
**Purpose**: Main application component and routing
**Features**:
- React Router setup with navigation
- Student/Educator page routing
- Unified navigation header
- Default route redirection to student page

#### `/frontend/src/App.css` & `/frontend/src/index.css`
**Purpose**: Global application styling
**Features**:
- Dark theme with GitHub-inspired design
- CSS custom properties for theming
- Responsive design utilities
- Mathematical content styling

### Page Components (`/frontend/src/pages`)

#### `/frontend/src/pages/StudentPage.jsx`
**Purpose**: Main student interface for solving puzzles
**Key Features**:
- Puzzle-first layout: toolbar with **Practice | Challenge**, status pill and **New puzzle**
- Puzzle settings in a side panel on desktop, or a bottom sheet behind a summary button on phones
- Generation/connection notices and loading states

**Dependencies**:
- `useAppState` hook for state management
- `PuzzleDisplay` for interactive solving
- `PuzzleSettings` for puzzle source, difficulty and topics
- `useMediaQuery` to choose the desktop or mobile settings layout

#### `/frontend/src/pages/EducatorPage.jsx`
**Purpose**: Educator dashboard for puzzle creation and management
**Key Features**:
- Page header with **Create puzzle** and **Export all**, plus an Online/Offline pill from the API health check
- Statistics tiles (total, categories, easy/medium/hard) and a per-category summary of created puzzles
- **Quick create** list that opens the creator with a category already chosen
- Success dialog after publishing that says whether the puzzle went to the server or was saved locally

**State Management**:
- Statistics loading and error handling
- Puzzle creation workflow management (the creator replaces the dashboard while open)
- Success modal state, including where the puzzle was saved (`savedTo`)

**Integration**:
- `puzzleManagerService` for server communication (`savePuzzle` returns `savedTo: 'server' | 'local'`)
- `PuzzleCreator` component for puzzle creation
- `PuzzleSuccessModal` for completion feedback

#### `/frontend/src/pages/FeedbackPage.jsx`
**Purpose**: Student feedback form sent to `POST /api/feedback`
**Key Features**:
- 1–5 rating as a segmented radio group, comment (with character count) and optional email
- Errors shown inline without losing the typed comment; thank-you card with a link back to the previous page

### Component System (`/frontend/src/components`)

The component system is organized by functionality with clear separation of concerns. Shared building blocks (buttons, cards, segmented controls, chips, badges, notices, form fields, dialogs/bottom sheets) are global classes in `frontend/src/styles/ui.css`, built on the `--color-*` theme tokens in `frontend/src/index.css`.

#### UI Components (`/frontend/src/components/ui`)

**`Dialog.jsx`**
- **Purpose**: Accessible modal dialog; `variant="sheet"` becomes a bottom sheet on mobile
- **Features**: Escape/backdrop/close button, focus moved in and restored on close, page scroll locked while open

**`DictionaryModal.jsx`**
- **Purpose**: Searchable dictionary of maths and algorithms terms, opened from the header

**`LoadingState.jsx`**
- **Purpose**: Consistent loading state (`size="small"` renders an inline spinner, e.g. inside a button)

**`StatusIndicator.jsx`**
- **Purpose**: Inline status pill showing whether puzzles come from the API (Online), the bundled data (Offline) or are still connecting

**`ThemeToggle.jsx`**
- **Purpose**: Light/dark theme icon button in the header

#### Layout Components (`/frontend/src/components/layout`)

**`PuzzleSettings.jsx`**
- **Purpose**: Puzzle source (Bundled / AI generated), difficulty and topic choices for the next puzzle
- **Features**: Segmented radio groups and topic chips; option lists and `describeSettings()` live in `puzzleSettingsOptions.js`

#### Puzzle Components (`/frontend/src/components/puzzle`)

**`PuzzleDisplay.jsx`**
- **Purpose**: Main puzzle solving interface
- **Features**:
  - Proof board: **Available steps** and **Your proof** side by side on desktop (the proof column stays in view while scrolling), stacked with the proof first on phones
  - Drag and drop (mouse, keyboard, and touch with a short press) plus tap controls: **+** to add, ↑ / ↓ to reorder, ✕ to remove. Both paths share the same move rules (Limited Moves counting, timer start, history reporting)
  - Practice mode with live feedback; Challenge mode (Lockout, Timed, Limited moves) with a rules/status banner and Submit
  - LaTeX rendering and interactive dropdown placeholders

**`ProofBlock.jsx`**
- **Purpose**: Individual proof statement blocks
- **Features**:
  - Drag-and-drop functionality with @dnd-kit
  - Step numbers and tap action buttons (which don't start a drag)
  - LaTeX rendering with interactive placeholders
  - Learner-friendly transitions for generated blocks with a pedagogical role

**`ProofValidationDisplay.jsx`**
- **Purpose**: Validation results and feedback display
- **Features**:
  - Detailed validation feedback
  - Score and progress indication
  - Error highlighting and suggestions

  #### Renderer Components (`/frontend/src/components/renderers`)

**`KatexRenderer.jsx`**
- **Purpose**: LaTeX mathematical expression rendering
- **Features**:
  - KaTeX integration for math rendering
  - Interactive placeholder replacement
  - Error handling for invalid LaTeX
  - Caching for performance optimization

#### Educator Components (`/frontend/src/components/educator`)

**`PuzzleCreator.jsx`**
- **Purpose**: Complete puzzle creation interface (Edit / Preview)
- **Features**:
  - Details, Tags and Proof steps cards; difficulty as a segmented control
  - Live LaTeX preview under each LaTeX field and the new-step box (Ctrl+Enter adds a step)
  - Steps reorder by dragging the grip (mouse, touch, keyboard) or with ↑ / ↓; delete per step
  - Validation messages under each field (`aria-invalid` / `aria-describedby`) plus a summary; save errors keep the form
  - Preview renders the puzzle with the student `PuzzleDisplay` so it can be solved before publishing
  - Sticky Cancel / Publish footer (above the tab bar on mobile)
- **Categories**: `educatorCategories.js` holds the category names, descriptions and suggested tags

**`CustomTagInput.jsx`**
- **Purpose**: Free-text tag entry (Enter or **Add**); lower-cases tags and blocks duplicates

**`PuzzleSuccessModal.jsx`**
- **Purpose**: Dialog shown after publishing
- **Features**: Server saves say students can solve it now; local fallback saves explain which downloaded JSON file replaces `frontend/src/data/puzzles/<file>`

#### Navigation Components (`/frontend/src/components/navigation`)

**`NavigationHeader.jsx`**
- **Purpose**: App header and mobile navigation
- **Features**:
  - Desktop: one header row with the brand, Student/Educator links, Feedback link, dictionary and theme buttons
  - Mobile (< 768px): compact header (brand, dictionary, theme) plus a fixed bottom tab bar (Student, Educator, Feedback)
  - Active page marked with `aria-current`, skip-to-content link, Feedback remembers the page you came from

### Hooks (`/frontend/src/hooks`)

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
- `usePuzzles(category, filters, { enabled })` - Multiple puzzles; retries every 5s on failure while enabled
- `useApiHealth({ enabled })` - Health check polling

Both hooks are disabled while the student has selected the bundled (local) puzzles.

### Services (`/frontend/src/services`)

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

#### `puzzleLoader.js`
**Purpose**: JSON-based puzzle loading service
**Features**:
- Static puzzle data loading
- Category-based organization
- Filtering and search capabilities
- Metadata extraction

### Utilities (`/frontend/src/utils`)

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

### Puzzle Data (`/frontend/src/data`)

`terms.js` holds the dictionary terms; the bundled puzzles are below.

#### Bundled puzzles (`/frontend/src/data/puzzles`)
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

### Styling (`/frontend/src/styles`)

#### `shared.css`
**Purpose**: Shared styling utilities and variables
**Features**:
- CSS custom properties for theming
- Common utility classes
- Responsive breakpoints
- Mathematical content styling

---

## Backend Structure

### Backend package (`/backend`)

#### `/backend/package.json`
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

#### `/backend/server.js`
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

### Data Models (`/backend/models`)

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

### API Routes (`/backend/routes`)

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

### Database Scripts (`/backend/scripts`)

#### `migratePuzzles.js`
**Purpose**: Data migration utility for initial setup
**Features**:
- Import JSON puzzle data to MongoDB
- Duplicate detection and handling
- Progress reporting
- Error handling and rollback

**Usage**:
```bash
cd backend
npm run migrate
```

### Configuration Files

#### `/backend/.env` (Not in repo - see .env.example)
**Purpose**: Server environment configuration
```env
MONGODB_URI=mongodb+srv://...    # MongoDB connection string
PORT=5001                        # Server port
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
│   ├── Layout Components (PuzzleSettings)
│   ├── UI Components (Dialog, LoadingState, StatusIndicator)
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
   cd backend && npm install && cd ..
   
   # Configure environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with MongoDB URI
   ```

2. **Database Setup**:
   ```bash
   # Start MongoDB (local) or configure Atlas
   cd backend
   npm run migrate  # Import initial puzzle data
   ```

3. **Development Server**:
   ```bash
   # Full stack development
   npm run dev:fullstack
   
   # Or separately
   npm run dev         # Frontend (port 5173)
   cd backend && npm run dev  # Backend (port 5000)
   ```

### Development Commands

```bash
# Frontend Development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Backend Development  
cd backend
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

1. **Automated Testing** (run in CI on every pull request; see `development.md`):
   - Frontend: Vitest + React Testing Library (`npm run test:frontend`) covering LaTeX rendering of every bundled puzzle, proof blocks, practice/challenge modes, puzzle generation flow and the API client
   - Backend: `node:test` (`npm run test:backend`) covering the generation service, puzzle contract, OpenAI client and Lean client

2. **Manual Testing**:
   - Educator puzzle creation workflow
   - Student puzzle solving experience
   - Data source switching functionality
   - Mobile responsiveness

3. **Integration Testing**:
   - Frontend-backend API integration
   - Database migration and data integrity
   - Error handling and fallback mechanisms

4. **Sample Data**: 
   - `sample-puzzles.md` provides comprehensive test scenarios
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
cd backend
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
- Backend: http://localhost:5001
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
- `package.json` - Repo-level scripts (setup, dev, test, lint) and lint tooling
- `eslint.config.js` - Code quality configuration for all packages
- `docker-compose.yml` - Container setup (see [deployment.md](deployment.md))
- `.gitignore` - Git exclusion patterns
- `README.md` - Main project documentation
- `docs/` - Guides (this file, development, deployment, database, educator, sample puzzles)

### Frontend package (`/frontend`)
- `package.json` - Frontend dependencies and scripts
- `vite.config.js` - Vite build and Vitest configuration
- `index.html` - HTML template with meta tags
- `.env.example` - Frontend environment template (copy to `.env`)
- `Dockerfile`, `nginx.conf`, `.dockerignore` - Production image (Node build, Nginx serve)

### Frontend (`/frontend/src`)
- `main.jsx` - React application entry point
- `App.jsx` - Main application component and routing
- `App.css` - Global application styles
- `index.css` - Base CSS styles

### Pages (`/frontend/src/pages`)
- `StudentPage.jsx` - Student puzzle solving interface
- `EducatorPage.jsx` - Educator dashboard and management
- `FeedbackPage.jsx` - Student feedback form
- `StudentPage.module.css` - Student page styling
- `EducatorPage.module.css` - Educator page styling
- `index.js` - Page component exports

### Components (`/frontend/src/components`)
- `index.js` - Main component export aggregation
- `README.md` - Component organization documentation

### UI Components (`/frontend/src/components/ui`)
- `LoadingState.jsx` - Loading spinner component
- `StatusIndicator.jsx` - Online / offline / connecting status pill
- `Dialog.jsx` - Accessible dialog / mobile bottom sheet
- `DictionaryModal.jsx` - Notation dictionary (opened from the header)
- `ThemeToggle.jsx` - Light/dark theme switch
- CSS Modules for each component
- `index.js` - UI component exports

### Layout Components (`/frontend/src/components/layout`)
- `PuzzleSettings.jsx` - Puzzle source, difficulty and topic settings
- `puzzleSettingsOptions.js` - Settings options and summary text
- `index.js` - Layout component exports

### Puzzle Components (`/frontend/src/components/puzzle`)
- `PuzzleDisplay.jsx` - Main puzzle solving interface (practice and challenge modes)
- `ProofBlock.jsx` - Individual proof block component
- `ProofValidationDisplay.jsx` - Validation feedback display
- CSS files for styling
- `index.js` - Puzzle component exports

### Renderer Components (`/frontend/src/components/renderers`)
- `KatexRenderer.jsx` - LaTeX mathematical rendering
- `index.js` - Renderer component exports

### Educator Components (`/frontend/src/components/educator`)
- `PuzzleCreator.jsx` - Complete puzzle creation interface
- `CustomTagInput.jsx` - Tag input component
- `PuzzleSuccessModal.jsx` - Success dialog (server vs. local save)
- `educatorCategories.js` - Categories and suggested tags
- `PuzzleCreator.module.css` - Creator styling
- `index.js` - Educator component exports

### Navigation Components (`/frontend/src/components/navigation`)
- `NavigationHeader.jsx` - Main application navigation
- `index.js` - Navigation component exports

### Hooks (`/frontend/src/hooks`)
- `useAppState.js` - Central application state management
- `usePuzzles.js` - Puzzle data fetching hooks

### Services (`/frontend/src/services`)
- `puzzleService.js` - Core API communication service
- `puzzleManagerService.js` - High-level puzzle management
- `puzzleLoader.js` - JSON-based puzzle loading service

### Utilities (`/frontend/src/utils`)
- `ProofValidator.js` - Proof validation logic and feedback

### Data (`/frontend/src/data`)
- `terms.js` - Dictionary terms
- `puzzles/` - Bundled JSON puzzle files, loaded by `frontend/src/services/puzzleLoader.js`

### Styles (`/frontend/src/styles`)
- `shared.css` - Shared styling utilities
- `ui.css` - Design system classes (buttons, cards, fields, dialogs)

### Backend (`/backend`)
- `server.js` - Main server application
- `package.json` - Backend dependencies and scripts
- `README.md` - Backend documentation
- `.env.example` - Environment template
- `Dockerfile`, `.dockerignore` - Production API image

### Models (`/backend/models`)
- `Puzzle.js` - MongoDB puzzle schema
- `PuzzleHistory.js`, `Feedback.js`, `GenerationUsage.js` - History, feedback and generation-usage schemas

### Routes (`/backend/routes`)
- `puzzles.js` - RESTful API endpoints
- `generation.js`, `feedback.js` - Generation and feedback endpoints

### Scripts (`/backend/scripts`)
- `migratePuzzles.js` - Imports `frontend/src/data/puzzles` into MongoDB
- `exportFeedback.js` - Exports stored feedback as JSON

### Lean worker (`/lean-worker`)
- `server.js`, `verifier.js`, `limiter.js` - Verification service, proof policy and compile queue
- `lean-toolchain`, `lakefile.toml`, `lake-manifest.json` - Lean and Mathlib pins

### Documentation (`/docs`)
- [README.md](README.md) - Index of all guides
- [development.md](development.md) - Current development setup and bundled JSON reference
- [deployment.md](deployment.md) - Docker images, Compose and production settings
- [database-setup.md](database-setup.md) - Database setup and puzzle import
- [sample-puzzles.md](sample-puzzles.md) - Puzzles for testing the educator workflow
- [archive/json-migration-guide.md](archive/json-migration-guide.md) - Historical JavaScript-to-JSON migration notes
- [educator-guide.md](educator-guide.md) - Puzzle creation, publishing, and backups
