# Parsons Puzzle SUTD - Backend API

This is the backend API service for the Parsons Puzzle SUTD application, built with Node.js, Express, and MongoDB Atlas.

## Features

- RESTful API for puzzle management
- MongoDB Atlas integration
- Puzzle categorization and filtering
- Search functionality
- Rate limiting and security middleware
- Data migration from local files

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account
- npm or yarn package manager

## Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Configuration

1. Copy the environment example file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

### 3. MongoDB Atlas Setup

1. **Create a MongoDB Atlas Account**: Go to [MongoDB Atlas](https://cloud.mongodb.com/) and sign up
2. **Create a Cluster**: 
   - Choose the free tier (M0)
   - Select your preferred region
   - Create cluster
3. **Create Database User**:
   - Go to Database Access
   - Add new database user with username/password
   - Grant read/write permissions
4. **Configure Network Access**:
   - Go to Network Access
   - Add IP address (0.0.0.0/0 for development, or your specific IP)
5. **Get Connection String**:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string and update your `.env` file

### 4. Migrate Existing Puzzles

Run the migration script to import existing puzzles from local files:

```bash
npm run migrate
```

This will:
- Connect to your MongoDB Atlas database
- Import all puzzles from the existing local files
- Categorize them appropriately
- Add metadata like difficulty and tags

### 5. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Puzzles

- `GET /api/puzzles` - Get all puzzles with optional filtering
  - Query params: `category`, `difficulty`, `tags`, `search`, `limit`, `offset`
- `GET /api/puzzles/:id` - Get specific puzzle by ID
- `GET /api/puzzles/category/:category` - Get puzzles by category
- `POST /api/puzzles` - Create new puzzle
- `PUT /api/puzzles/:id` - Update puzzle
- `DELETE /api/puzzles/:id` - Soft delete puzzle
- `GET /api/puzzles/stats/summary` - Get puzzle statistics

### Health Check

- `GET /api/health` - Server health check

## Data Model

### Puzzle Schema

```javascript
{
  id: String,              // Unique identifier
  title: String,           // LaTeX title
  displayTitle: String,    // Human-readable title
  statement: String,       // Problem statement
  category: String,        // bigO, induction, setTheory, recursion
  difficulty: String,      // easy, medium, hard
  blocks: [{               // Proof blocks
    id: String,
    latex: String
  }],
  solutionOrder: [String], // Correct order of block IDs
  tags: [String],          // Searchable tags
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

## Security Features

- CORS protection
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- Input validation and sanitization
- Soft delete for data preservation

## Development

### Project Structure

```
server/
├── models/           # MongoDB schemas
├── routes/           # API route handlers
├── scripts/          # Utility scripts (migration, etc.)
├── package.json      # Dependencies and scripts
├── server.js         # Main server file
└── .env.example      # Environment variables template
```

### Adding New Puzzles

You can add puzzles through the API or by updating the migration script:

1. **Via API**: POST to `/api/puzzles` with puzzle data
2. **Via Migration**: Add puzzles to the local files and re-run migration

### Environment Variables

- `MONGODB_URI`: MongoDB Atlas connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS
- `RATE_LIMIT_WINDOW_MS`: Rate limit window
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

## Troubleshooting

### Common Issues

1. **Connection Issues**: Verify your MongoDB Atlas connection string and network access settings
2. **Authentication Errors**: Check your database user credentials
3. **Migration Errors**: Ensure all puzzle files are properly formatted
4. **CORS Errors**: Verify the `FRONTEND_URL` environment variable

### Logs

The server logs all errors to the console. In production, consider using a proper logging service.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use PM2 or similar process manager
3. Set up proper logging
4. Configure reverse proxy (nginx)
5. Use SSL certificates
6. Set up monitoring and alerts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
