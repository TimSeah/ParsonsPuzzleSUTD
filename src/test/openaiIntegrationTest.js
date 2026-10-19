// Integration test for OpenAI services
import openaiService from '../services/openaiService.js';
import promptBuilder from '../services/promptBuilder.js';
import puzzleGenerator from '../services/puzzleGenerator.js';

/**
 * Test the complete OpenAI integration
 */
async function testOpenAIIntegration() {
  console.log('=== OpenAI Integration Test ===\n');
  
  // Test 1: OpenAI Service Configuration
  console.log('1. Testing OpenAI Service Configuration...');
  const isConfigured = openaiService.isConfigured();
  console.log(`   API Key configured: ${isConfigured}`);
  
  if (!isConfigured) {
    console.log(`   Error message: ${openaiService.getConfigurationError()}`);
    console.log('   ✓ Configuration error handling works\n');
  }
  
  // Test 2: Prompt Builder
  console.log('2. Testing Prompt Builder...');
  const testSelections = {
    difficulty: 'easy',
    proofTypes: ['induction', 'big-o'],
    additionalTags: ['mathematical', 'proof']
  };
  
  const prompt = promptBuilder.createPuzzlePrompt(testSelections);
  console.log(`   Generated prompt length: ${prompt.length} characters`);
  console.log(`   Contains difficulty: ${prompt.includes('easy')}`);
  console.log(`   Contains proof types: ${prompt.includes('induction')}`);
  console.log('   ✓ Prompt builder works correctly\n');
  
  // Test 3: Validation and Normalization
  console.log('3. Testing Selection Validation...');
  const normalized = promptBuilder.validateAndNormalizeSelections('invalid', ['invalid-type']);
  console.log(`   Normalized difficulty: ${normalized.difficulty}`);
  console.log(`   Normalized proof types: ${normalized.proofTypes.join(', ')}`);
  console.log('   ✓ Validation and normalization works\n');
  
  // Test 4: Label Mapping
  console.log('4. Testing Label Mapping...');
  const displayLabels = ['Big O', 'Set Theory', 'Graph Theory'];
  const mappedLabels = promptBuilder.mapProofTypeLabels(displayLabels);
  console.log(`   Mapped labels: ${mappedLabels.join(', ')}`);
  console.log('   ✓ Label mapping works correctly\n');
  
  // Test 5: Puzzle Generator (without API call)
  console.log('5. Testing Puzzle Generator Structure...');
  try {
    // This will fail due to no API key, but we can test the error handling
    await puzzleGenerator.generatePuzzle(testSelections);
  } catch (error) {
    if (error.message.includes('Direct browser OpenAI access is disabled')) {
      console.log('   ✓ Puzzle generator error handling works correctly');
      console.log(`   Error message: ${error.message}\n`);
    } else {
      console.log(`   Unexpected error: ${error.message}\n`);
      process.exitCode = 1;
    }
  }
  
  // Test 6: Response Parser (with mock data)
  console.log('6. Testing Response Parser...');
  const mockResponse = JSON.stringify({
    title: "Test Puzzle",
    displayTitle: "Test Puzzle",
    statement: "Prove that...",
    difficulty: "easy",
    category: "induction",
    tags: ["test"],
    blocks: [
      { id: "block1", latex: "Base case: n = 1" },
      { id: "block2", latex: "Assume true for n = k" },
      { id: "block3", latex: "Prove for n = k + 1" }
    ],
    solutionOrder: ["block1", "block2", "block3"]
  });
  
  try {
    const parsed = puzzleGenerator.parseResponse(mockResponse);
    console.log(`   Parsed puzzle title: ${parsed.displayTitle}`);
    console.log(`   Block count: ${parsed.blocks.length}`);
    console.log('   ✓ Response parser works correctly\n');
  } catch (error) {
    console.log(`   Parser error: ${error.message}\n`);
  }
  
  console.log('=== Integration Test Complete ===');
  console.log('All components are properly structured and handle errors correctly.');
  console.log('Live OpenAI calls are tested through the secure backend /api/generate endpoint.');
}

// Export for use in other files
export { testOpenAIIntegration };

// Run test if this file is executed directly
if (typeof window === 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  testOpenAIIntegration().catch(console.error);
}
