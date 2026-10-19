// Test script to verify JSON puzzle system works
import { PuzzleLoader } from '../services/puzzleLoader.js';

console.log('🧪 Testing JSON Puzzle System...');

try {
  // Test basic loading
  const allPuzzles = PuzzleLoader.getAllPuzzles();
  console.log(`✅ Loaded ${allPuzzles.length} puzzles total`);

  // Test categories
  const categories = PuzzleLoader.getCategories();
  console.log(`✅ Found ${Object.keys(categories).length} categories:`, Object.keys(categories));

  // Test specific puzzle
  const bigOPuzzles = PuzzleLoader.getPuzzlesByCategory('Big O Notation');
  console.log(`✅ Big O category has ${bigOPuzzles.length} puzzles`);

  // Test search
  const fibonacciPuzzles = PuzzleLoader.searchPuzzles('fibonacci');
  console.log(`✅ Search for 'fibonacci' found ${fibonacciPuzzles.length} puzzles`);

  // Test difficulty filter
  const easyPuzzles = PuzzleLoader.getPuzzlesByDifficulty('easy');
  console.log(`✅ Found ${easyPuzzles.length} easy puzzles`);

  // Test random puzzle
  const randomPuzzle = PuzzleLoader.getRandomPuzzle();
  console.log(`✅ Random puzzle: ${randomPuzzle.displayTitle}`);

  console.log('🎉 All JSON puzzle system tests passed!');
  
  // Show a sample puzzle structure
  console.log('\n📝 Sample puzzle structure:');
  console.log(JSON.stringify(allPuzzles[0], null, 2));

} catch (error) {
  console.error('❌ JSON puzzle system test failed:', error);
  process.exitCode = 1;
}

export default function runTests() {
  console.log('JSON Puzzle System Test Complete');
}
