# Development Setup Instructions

## Overview
This project now uses a full-stack architecture with:
- **Frontend**: React with Vite (port 5173)
- **Backend**: Node.js/Express API (port 5000)  
- **Database**: MongoDB Atlas

## Quick Start

### 1. Start Both Frontend and Backend
```powershell
npm run dev:fullstack
```

### 2. Or Start Separately

**Backend:**
```powershell
cd server
npm run dev
```

**Frontend (in a new terminal):**
```powershell
npm run dev
```

### 3. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Health Check: http://localhost:5000/api/health

## Features

### CORS Configuration
The backend now has relaxed CORS settings that allow:
- Multiple development URLs (localhost:5173, localhost:3000, 127.0.0.1:5173)
- Production URL from environment variables
- All standard HTTP methods (GET, POST, PUT, DELETE, OPTIONS)

### Frontend API Integration
The main `App.jsx` file now includes full API integration and:
- Automatically connects to the backend API
- Falls back to local puzzle data if API is unavailable
- Shows connection status (🌐 Database or 💾 Local)
- Allows manual switching between data sources

### Database Migration
If puzzles aren't showing from the database, run:
```powershell
cd server
npm run migrate
```

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### Backend (server/.env)
```
MONGODB_URI=mongodb+srv://...your-mongodb-url...
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

1. **CORS Issues**: The CORS configuration now allows multiple development URLs
2. **API Not Connecting**: Check that both servers are running on the correct ports
3. **No Puzzles**: Run the migration script in the server directory
4. **Environment Issues**: Ensure .env files are properly configured

The application will gracefully fall back to local data if the API is unavailable.
