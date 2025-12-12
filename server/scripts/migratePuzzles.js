import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Puzzle from '../models/Puzzle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parsonspuzzle';

// Function to load JSON puzzle data
function loadPuzzleData() {
  const puzzleDataPath = path.join(__dirname, '../../src/puzzles/data');
  
  const bigOData = JSON.parse(fs.readFileSync(path.join(puzzleDataPath, 'big-o-proofs.json'), 'utf8'));
  const inductionData = JSON.parse(fs.readFileSync(path.join(puzzleDataPath, 'induction-proofs.json'), 'utf8'));
  const setTheoryData = JSON.parse(fs.readFileSync(path.join(puzzleDataPath, 'set-theory-proofs.json'), 'utf8'));
  const recursionData = JSON.parse(fs.readFileSync(path.join(puzzleDataPath, 'recursion-proofs.json'), 'utf8'));

  return {
    bigO: bigOData.puzzles,
    induction: inductionData.puzzles,
    setTheory: setTheoryData.puzzles,
    recursion: recursionData.puzzles
  };
}

// Function to determine difficulty based on puzzle characteristics (fallback if not provided)
function determineDifficulty(puzzle) {
  // If difficulty is already provided in JSON, use it
  if (puzzle.difficulty) {
    return puzzle.difficulty;
  }
  
  // Otherwise, determine based on block count
  const blockCount = puzzle.blocks.length;
  if (blockCount <= 5) return 'easy';
  if (blockCount <= 10) return 'medium';
  return 'hard';
}

// Function to generate tags based on puzzle content (fallback if not provided)
function generateTags(puzzle, category) {
  // If tags are already provided in JSON, use them with category
  if (puzzle.tags && Array.isArray(puzzle.tags)) {
    return [...new Set([category, ...puzzle.tags])]; // Ensure category is included and remove duplicates
  }
  
  // Otherwise, generate based on content
  const tags = [category];
  
  // Add tags based on title and content
  const content = `${puzzle.title} ${puzzle.statement}`.toLowerCase();
  
  if (content.includes('big o') || content.includes('theta') || content.includes('omega')) {
    tags.push('complexity', 'asymptotic');
  }
  if (content.includes('induction')) {
    tags.push('induction', 'proof');
  }
  if (content.includes('set')) {
    tags.push('set-theory', 'logic');
  }
  if (content.includes('recursion') || content.includes('recursive')) {
    tags.push('recursion', 'algorithm');
  }
  if (content.includes('log')) {
    tags.push('logarithm');
  }
  if (content.includes('fibonacci')) {
    tags.push('fibonacci', 'sequence');
  }
  if (content.includes('hanoi')) {
    tags.push('towers-of-hanoi', 'game');
  }
  
  return [...new Set(tags)]; // Remove duplicates
}

async function migratePuzzles() {
  try {
    console.log('Connecting to MongoDB...');
    console.log(`Platform: ${process.platform}`);
    
    // Connection options similar to the main server
    const connectionOptions = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      maxPoolSize: 10
    };
    
    // Add TLS options for Windows/Atlas
    if (MONGODB_URI.includes('mongodb+srv') || process.platform === 'win32') {
      connectionOptions.tls = true;
      connectionOptions.tlsAllowInvalidCertificates = true;
    }
    
    await mongoose.connect(MONGODB_URI, connectionOptions);
    console.log('Connected to MongoDB successfully!');
    
    // Load puzzle data from JSON files
    console.log('Loading puzzle data from JSON files...');
    const puzzleCategories = loadPuzzleData();
    
    // Clear existing puzzles (optional - uncomment if you want to start fresh)
    // console.log('Clearing existing puzzles...');
    // await Puzzle.deleteMany({});
    
    const allPuzzles = [];
    
    // Process each category
    for (const [category, puzzles] of Object.entries(puzzleCategories)) {
      console.log(`Processing ${category} puzzles...`);
      
      for (const puzzle of puzzles) {
        const puzzleData = {
          ...puzzle,
          category,
          difficulty: determineDifficulty(puzzle),
          tags: generateTags(puzzle, category),
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        };
        
        allPuzzles.push(puzzleData);
      }
    }
    
    console.log(`Inserting ${allPuzzles.length} puzzles into database...`);
    
    // Insert all puzzles
    const insertedPuzzles = [];
    for (const puzzleData of allPuzzles) {
      try {
        // Check if puzzle already exists
        const existingPuzzle = await Puzzle.findOne({ id: puzzleData.id });
        
        if (existingPuzzle) {
          console.log(`Puzzle ${puzzleData.id} already exists, updating...`);
          const updatedPuzzle = await Puzzle.findOneAndUpdate(
            { id: puzzleData.id },
            puzzleData,
            { new: true, upsert: true }
          );
          insertedPuzzles.push(updatedPuzzle);
        } else {
          console.log(`Creating new puzzle: ${puzzleData.id}`);
          const newPuzzle = new Puzzle(puzzleData);
          const savedPuzzle = await newPuzzle.save();
          insertedPuzzles.push(savedPuzzle);
        }
      } catch (error) {
        console.error(`Error processing puzzle ${puzzleData.id}:`, error.message);
      }
    }
    
    console.log(`Successfully processed ${insertedPuzzles.length} puzzles!`);
    
    // Display summary
    const summary = await Puzzle.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          difficulties: { $push: '$difficulty' }
        }
      }
    ]);
    
    console.log('\nMigration Summary:');
    console.log('===================');
    summary.forEach(cat => {
      const difficultyCount = cat.difficulties.reduce((acc, diff) => {
        acc[diff] = (acc[diff] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`${cat._id}: ${cat.count} puzzles`);
      console.log(`  - Easy: ${difficultyCount.easy || 0}`);
      console.log(`  - Medium: ${difficultyCount.medium || 0}`);
      console.log(`  - Hard: ${difficultyCount.hard || 0}`);
    });
    
    const totalCount = await Puzzle.countDocuments({ isActive: true });
    console.log(`\nTotal active puzzles: ${totalCount}`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run migration if this script is executed directly
if (process.argv[1] && process.argv[1].endsWith('migratePuzzles.js')) {
  console.log('Starting migration...');
  migratePuzzles().then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  }).catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

export default migratePuzzles;
