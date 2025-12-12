# Parsons Puzzle SUTD - Mathematical Proof Learning Platform

A modern, interactive web application designed to help students learn mathematical proofs through Parsons puzzles (drag-and-drop code/proof blocks). Built with React, Vite, and Node.js, featuring both student learning interfaces and educator content creation tools.

## 🎯 Features

### Student Learning Mode
- **Interactive Proof Construction**: Drag-and-drop proof blocks to construct valid mathematical proofs
- **Multiple Proof Categories**: 
  - Big O Notation proofs
  - Mathematical Induction proofs
  - Recursion and Recurrence Relations
  - Set Theory proofs
- **Real-time LaTeX Rendering**: Mathematical expressions rendered with KaTeX
- **Interactive Elements**: Smart placeholders (complexity notation, operators, quantifiers)
- **Validation System**: Immediate feedback on proof correctness
- **Progress Tracking**: Visual indicators for completion status
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Educator Content Creation Mode
- **Puzzle Creator Interface**: Intuitive drag-and-drop puzzle creation
- **LaTeX Editor**: Live preview for mathematical notation
- **Category-Based Organization**: Create puzzles for different mathematical domains
- **Tag Management**: Comprehensive tagging system with suggested and custom tags
- **Drag-and-Drop Block Ordering**: Visual proof step arrangement
- **Real-time Validation**: Error checking and feedback during creation
- **Server Integration**: Instant puzzle publishing (no file management needed)
- **Statistics Dashboard**: Track created puzzles and usage analytics

### Technical Features
- **Hybrid Data System**: JSON files for default content + MongoDB for educator-created puzzles
- **Server-Side Management**: RESTful API for puzzle CRUD operations
- **Real-time Updates**: New puzzles appear immediately for students
- **Fallback Mechanisms**: Graceful degradation when server is unavailable
- **Modern UI/UX**: Dark theme with GitHub-inspired design system
- **Accessibility**: Screen reader friendly with proper ARIA labels

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** for version control

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/lolkabash/ParsonsPuzzleSUTD.git
cd ParsonsPuzzleSUTD
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install server dependencies**
```bash
cd server
npm install
```

4. **Configure environment variables**
```bash
# In the server directory, copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# MONGODB_URI=mongodb://localhost:27017/parsonspuzzle  # Local MongoDB
# or
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/parsonspuzzle  # MongoDB Atlas
PORT=5000
NODE_ENV=development
```

### Development Setup

1. **Start the backend server**
```bash
cd server
npm start
```
The server will run on `http://localhost:5000`

2. **Start the frontend development server**
```bash
# In the root directory
npm run dev
```
The application will be available at `http://localhost:5173`

## 📖 Usage Guide

### For Students

1. **Access Student Mode**: Navigate to `http://localhost:5173/student`
2. **Select a Puzzle**: Choose from available proof categories
3. **Solve the Puzzle**:
   - Read the problem statement
   - Drag proof blocks from the available blocks panel
   - Arrange them in the correct logical order
   - Fill in interactive elements (operators, complexity notations, etc.)
4. **Submit and Validate**: Click "Validate Proof" to check your solution
5. **Learn from Feedback**: Review explanations for incorrect attempts

### For Educators

1. **Access Educator Mode**: Navigate to `http://localhost:5173/educator`

2. **Create a New Puzzle**:
   - Click "Create New Puzzle" or select a specific category
   - Fill in basic information (title, statement, difficulty)
   - Add relevant tags for categorization
   - Create proof blocks using LaTeX notation
   - Arrange blocks in the correct solution order
   - Preview how students will see the puzzle
   - Publish to make it immediately available

3. **Manage Existing Puzzles**:
   - View statistics on created puzzles
   - Export puzzle collections
   - Monitor student engagement

### LaTeX Notation Guide

#### Basic Mathematical Expressions
```latex
\text{Regular text}
\frac{numerator}{denominator}
\sum_{i=1}^{n}
\log n
n^2
\sqrt{n}
```

#### Interactive Placeholders
```latex
{{complexity}}  // Dropdown: O, Ω, Θ
{{op}}          // Dropdown: ≤, ≥, =, ≠
{{quantifier}}  // Dropdown: ∀, ∃
{{logic}}       // Dropdown: ∧, ∨
{{setop}}       // Dropdown: ∈, ⊆, ∪, ∩
```

## 🏗 Architecture

### Frontend (React + Vite)
```
src/
├── components/
│   ├── educator/        # Puzzle creation components
│   ├── layout/          # Navigation and layout
│   ├── puzzle/          # Student puzzle interface
│   ├── renderers/       # LaTeX and content rendering
│   └── ui/              # Reusable UI components
├── hooks/               # React custom hooks
├── pages/               # Main page components
├── services/            # API and data services
├── puzzles/             # Default puzzle data (JSON)
└── utils/               # Utility functions
```

### Backend (Node.js + Express + MongoDB)
```
server/
├── models/              # MongoDB schemas
├── routes/              # API endpoints
├── scripts/             # Database utilities
└── server.js            # Main server file
```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
MONGODB_URI=mongodb://localhost:27017/parsonspuzzle
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Database Schema

**Puzzle Model**
```javascript
{
  id: String,
  title: String,           // LaTeX title
  displayTitle: String,    // Plain text title
  statement: String,       // LaTeX problem statement
  category: String,        // 'bigO', 'induction', 'recursion', 'setTheory'
  difficulty: String,      // 'easy', 'medium', 'hard'
  tags: [String],         // Array of tags
  blocks: [{              // Proof steps
    id: String,
    latex: String
  }],
  solutionOrder: [String], // Correct order of block IDs
  createdAt: Date,
  createdBy: String,
  isActive: Boolean
}
```

## 🛠 Development

### Adding New Puzzle Categories

1. **Update the categories configuration**:
```javascript
// In PuzzleCreator.jsx
const CATEGORIES = {
  'new-category': {
    name: 'New Category',
    description: 'Description of new category',
    file: 'new-category-proofs.json',
    suggestedTags: ['tag1', 'tag2']
  }
};
```

2. **Create default puzzle file**:
```json
// src/puzzles/data/new-category-proofs.json
{
  "category": "New Category",
  "description": "Category description",
  "puzzles": []
}
```

3. **Update the puzzle service** to include the new category in loading logic.

### Adding Interactive Elements

1. **Define placeholder patterns** in `ProofValidator.js`
2. **Create corresponding UI components** for dropdowns
3. **Update the rendering logic** in `ProofBlock.jsx`

### Customizing Themes

The application uses CSS custom properties for theming:
```css
:root {
  --color-accent-fg: #1f6feb;
  --color-canvas-default: #0d1117;
  --color-fg-default: #e6edf3;
  /* Add more custom properties */
}
```

## 🧪 Testing

### Manual Testing Checklist

**Student Mode**:
- [ ] Puzzle loading and rendering
- [ ] Drag-and-drop functionality
- [ ] Interactive element behavior
- [ ] Validation and feedback
- [ ] Mobile responsiveness

**Educator Mode**:
- [ ] Puzzle creation workflow
- [ ] LaTeX preview functionality
- [ ] Server integration
- [ ] Statistics accuracy
- [ ] Error handling

### Running Tests

```bash
# Run frontend tests (if configured)
npm test

# Run server tests (if configured)
cd server
npm test
```

## 🚢 Deployment

### Frontend Deployment

1. **Build the application**:
```bash
npm run build
```

2. **Deploy to hosting service** (Vercel, Netlify, etc.):
```bash
# Example for Vercel
npm install -g vercel
vercel --prod
```

### Backend Deployment

1. **Prepare for production**:
```bash
cd server
npm install --production
```

2. **Deploy to cloud service** (Heroku, Railway, etc.):
```bash
# Set environment variables on your hosting platform
# Deploy according to platform instructions
```

### Database Setup

**MongoDB Atlas** (Recommended for production):
1. Create a MongoDB Atlas account
2. Set up a cluster
3. Get the connection string
4. Update `MONGODB_URI` in your environment variables

## 📚 Educational Use

### Course Integration

This platform is designed for:
- **Computer Science Courses**: Algorithms, complexity analysis
- **Mathematics Courses**: Proof techniques, logic
- **Self-Study**: Individual practice with mathematical proofs

### Assessment Features

Educators can use the platform to:
- Create homework assignments
- Generate practice problems
- Track student progress
- Identify common misconceptions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **SUTD (Singapore University of Technology and Design)** for the educational context
- **KaTeX** for mathematical rendering
- **@dnd-kit** for drag-and-drop functionality
- **React** and **Vite** for the development framework

## 📞 Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Check the [Educator Guide](EDUCATOR_GUIDE.md) for detailed usage instructions
- Review the existing documentation and code comments

---

**Built with ❤️ for mathematics education**
