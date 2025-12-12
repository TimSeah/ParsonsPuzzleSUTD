# MongoDB Atlas Migration Guide

This guide will walk you through the complete process of migrating your Parsons Puzzle application from local file storage to MongoDB Atlas.

## Overview

The migration involves:
1. Setting up MongoDB Atlas
2. Running the backend server
3. Migrating existing puzzle data
4. Testing the integration
5. Updating the frontend (optional)

## Step 1: MongoDB Atlas Setup

### Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sign up for a free account
3. Verify your email address

### Create a Cluster
1. Click "Create" to create a new cluster
2. Choose the **Free Tier (M0)**
3. Select your preferred **Cloud Provider & Region**
4. Leave other settings as default
5. Click "Create Cluster"
6. Wait for cluster creation (2-3 minutes)

### Configure Database Access
1. Go to **Database Access** in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and strong password (save these!)
5. Under "Database User Privileges", select "Read and write to any database"
6. Click "Add User"

### Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production, use your specific IP address
4. Click "Confirm"

### Get Connection String
1. Go to **Clusters** and click "Connect" on your cluster
2. Choose "Connect your application"
3. Select "Node.js" as driver and version "4.1 or later"
4. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 2: Backend Configuration

### Install Dependencies
```powershell
cd server
npm install
```

### Configure Environment Variables
1. Copy the environment template:
   ```powershell
   copy .env.example .env
   ```

2. Edit the `.env` file with your MongoDB details:
   ```env
   MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/parsonspuzzle?retryWrites=true&w=majority
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   ```

   **Replace:**
   - `your-username` with your database username
   - `your-password` with your database password
   - `cluster0.xxxxx` with your actual cluster URL
   - `parsonspuzzle` with your preferred database name

## Step 3: Start the Backend Server

```powershell
npm run dev
```

You should see:
```
Server running on port 5000
Connected to MongoDB Atlas
Environment: development
```

If you see connection errors, double-check:
- Your connection string format
- Username and password
- Network access configuration
- Internet connection

## Step 4: Migrate Existing Puzzles

Run the migration script to import your existing puzzles:

```powershell
npm run migrate
```

This will:
- Read all puzzle files from `src/puzzles/`
- Import them into MongoDB Atlas
- Add metadata like categories, difficulty, and tags
- Provide a summary of imported puzzles

Expected output:
```
Connecting to MongoDB...
Connected to MongoDB successfully!
Processing bigO puzzles...
Creating new puzzle: proof1
Creating new puzzle: proof2
...
Migration Summary:
===================
bigO: 4 puzzles
  - Easy: 1
  - Medium: 2
  - Hard: 1
induction: 3 puzzles
...
Total active puzzles: 11
Migration completed!
```

## Step 5: Test the API

### Health Check
Open your browser and go to: http://localhost:5000/api/health

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-01-08T..."
}
```

### Get All Puzzles
Go to: http://localhost:5000/api/puzzles

You should see a JSON response with all your puzzles.

### Test Specific Category
Go to: http://localhost:5000/api/puzzles/category/bigO

## Step 6: Frontend Integration (Optional)

The current frontend will continue to work with local data. To use the API:

### Option A: Keep Both (Recommended for Development)
1. The API-enabled component is now the main App.jsx file:
   ```powershell
   # App.jsx now includes full API integration
   ```

2. Import the legacy CSS if needed:
   ```jsx
   // Add to App.jsx if using legacy components
   import './styles/legacy-api.css';
   ```

3. The app will automatically:
   - Try to connect to the API
   - Fall back to local data if API is unavailable
   - Show connection status to users

### Option B: API Only
Replace the puzzle imports in your components with API calls using the provided hooks:

```jsx
import { usePuzzles } from './hooks/usePuzzles';

function YourComponent() {
  const { puzzles, loading, error } = usePuzzles();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    // Your component using puzzles from API
  );
}
```

## Step 7: Production Considerations

### Security
1. Replace `0.0.0.0/0` in Network Access with your server's IP
2. Use environment variables for all sensitive data
3. Enable MongoDB Atlas security features

### Performance
1. Create database indexes for frequently queried fields
2. Implement caching if needed
3. Consider connection pooling

### Monitoring
1. Monitor MongoDB Atlas metrics
2. Set up alerts for connection issues
3. Log API errors properly

### Backup
1. Enable automated backups in MongoDB Atlas
2. Test restore procedures
3. Document your backup strategy

## Troubleshooting

### Common Issues

**Connection Timeout:**
- Check your internet connection
- Verify Network Access settings in Atlas
- Ensure correct connection string

**Authentication Failed:**
- Double-check username and password
- Ensure user has proper permissions
- Check for special characters in password

**Migration Errors:**
- Ensure all puzzle files are properly formatted
- Check console logs for specific error messages
- Verify file paths in the migration script

**CORS Errors:**
- Check `FRONTEND_URL` environment variable
- Ensure frontend is running on the specified port

**API Not Responding:**
- Check if backend server is running
- Verify port configuration
- Check firewall settings

### Getting Help

1. Check the console logs for detailed error messages
2. Verify all configuration steps were completed
3. Test with a simple MongoDB connection script
4. Check MongoDB Atlas logs and metrics

## Next Steps

After successful migration, you can:

1. **Add new puzzles** via the API endpoints
2. **Implement user management** and authentication
3. **Add puzzle statistics** and analytics
4. **Create admin interface** for puzzle management
5. **Deploy to production** with proper security measures

## API Reference

### Main Endpoints
- `GET /api/puzzles` - Get all puzzles
- `GET /api/puzzles/:id` - Get specific puzzle
- `GET /api/puzzles/category/:category` - Get puzzles by category
- `POST /api/puzzles` - Create new puzzle
- `PUT /api/puzzles/:id` - Update puzzle
- `DELETE /api/puzzles/:id` - Delete puzzle

### Query Parameters
- `category` - Filter by category
- `difficulty` - Filter by difficulty (easy/medium/hard)
- `search` - Search in titles and content
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset

Congratulations! Your Parsons Puzzle application is now powered by MongoDB Atlas! 🎉
