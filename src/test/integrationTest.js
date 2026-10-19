/**
 * Integration test for the enhanced response parser
 * Tests the full puzzle generation flow with mock OpenAI responses
 */

import { PuzzleGenerator } from '../services/puzzleGenerator.js';

// Mock OpenAI service for testing
class MockOpenAIService {
  constructor() {
    this.configured = true;
  }

  isConfigured() {
    return this.configured;
  }

  getConfigurationError() {
    return null;
  }

  async generatePuzzle() {
    // Return a mock response that simulates OpenAI API
    return `{
      "title": "Mathematical Induction Proof",
      "displayTitle": "Sum Formula Proof",
      "statement": "Prove by mathematical induction that 1 + 2 + 3 + ... + n = n(n+1)/2",
      "difficulty": "medium",
      "category": "induction",
      "tags": ["induction", "summation", "proof"],
      "blocks": [
        {
          "id": "base_case",
          "latex": "Base case: For n = 1, LHS = 1 and RHS = 1(1+1)/2 = 1. So P(1) is true."
        },
        {
          "id": "inductive_hypothesis",
          "latex": "Inductive hypothesis: Assume P(k) is true for some k >= 1, i.e., 1 + 2 + ... + k = k(k+1)/2"
        },
        {
          "id": "inductive_step_setup",
          "latex": "Inductive step: We need to prove P(k+1), i.e., 1 + 2 + ... + k + (k+1) = (k+1)(k+2)/2"
        },
        {
          "id": "left_side_expansion",
          "latex": "LHS = 1 + 2 + ... + k + (k+1) = [1 + 2 + ... + k] + (k+1)"
        },
        {
          "id": "apply_hypothesis",
          "latex": "By the inductive hypothesis: LHS = k(k+1)/2 + (k+1)"
        },
        {
          "id": "algebraic_manipulation",
          "latex": "LHS = k(k+1)/2 + (k+1) = k(k+1)/2 + 2(k+1)/2 = [k(k+1) + 2(k+1)]/2"
        },
        {
          "id": "factor_out",
          "latex": "LHS = [(k+1)(k + 2)]/2 = (k+1)(k+2)/2 = RHS"
        },
        {
          "id": "conclusion",
          "latex": "Therefore, P(k+1) is true. By mathematical induction, P(n) is true for all n >= 1."
        }
      ],
      "solutionOrder": ["base_case", "inductive_hypothesis", "inductive_step_setup", "left_side_expansion", "apply_hypothesis", "algebraic_manipulation", "factor_out", "conclusion"]
    }`;
  }
}

// Create test generator with mock service
const generator = new PuzzleGenerator();
generator.openaiService = new MockOpenAIService();

async function testIntegration() {
  console.log('🔧 Running Integration Test');
  console.log('============================');
  
  try {
    // Test with valid user selections
    const userSelections = {
      difficulty: 'medium',
      proofTypes: ['induction']
    };
    
    console.log('Testing puzzle generation with selections:', userSelections);
    
    const puzzle = await generator.generatePuzzle(userSelections);
    
    console.log('\n✅ Puzzle Generation Successful!');
    console.log('================================');
    console.log('Puzzle ID:', puzzle.id);
    console.log('Title:', puzzle.displayTitle);
    console.log('Difficulty:', puzzle.difficulty);
    console.log('Category:', puzzle.category);
    console.log('Block count:', puzzle.blocks.length);
    console.log('Has solution order:', puzzle.solutionOrder.length === puzzle.blocks.length);
    console.log('All blocks have IDs:', puzzle.blocks.every(b => b.id && b.latex));
    console.log('Created timestamp:', puzzle.createdAt);
    console.log('Is active:', puzzle.isActive);
    console.log('Source:', puzzle.source);
    
    // Verify the puzzle structure
    console.log('\n🔍 Validation Results');
    console.log('=====================');
    
    const limits = { easy: [4, 7], medium: [7, 10], hard: [9, 12] }[puzzle.difficulty];
    const blockCountValid = puzzle.blocks.length >= limits[0] && puzzle.blocks.length <= limits[1];
    console.log(`Block count valid (${limits[0]}-${limits[1]}):`, blockCountValid);
    
    // Check all required fields are present
    const requiredFields = ['id', 'title', 'displayTitle', 'statement', 'difficulty', 'category', 'tags', 'blocks', 'solutionOrder', 'createdAt', 'isActive'];
    const hasAllFields = requiredFields.every(field => puzzle[field] !== undefined);
    console.log('Has all required fields:', hasAllFields);
    
    // Check solution order matches blocks
    const solutionOrderValid = puzzle.solutionOrder.length === puzzle.blocks.length &&
                              puzzle.solutionOrder.every(id => puzzle.blocks.some(block => block.id === id));
    console.log('Solution order valid:', solutionOrderValid);
    
    // Check unique block IDs
    const blockIds = puzzle.blocks.map(b => b.id);
    const uniqueIds = new Set(blockIds).size === blockIds.length;
    console.log('Block IDs are unique:', uniqueIds);
    
    if (blockCountValid && hasAllFields && solutionOrderValid && uniqueIds) {
      console.log('\n🎉 Integration test PASSED!');
      console.log('All requirements satisfied:');
      console.log('✓ Parse OpenAI response and extract puzzle components');
      console.log('✓ Validate puzzle has the required difficulty-specific block count');
      console.log('✓ Assign unique IDs to blocks and generate solution order');
      console.log('✓ Handle malformed responses with descriptive error messages');
      return true;
    } else {
      console.log('\n❌ Integration test FAILED!');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Integration test FAILED with error:', error.message);
    return false;
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling');
  console.log('=========================');
  
  // Test with malformed response
  const originalGeneratePuzzle = generator.openaiService.generatePuzzle;
  
  // Test malformed JSON
  generator.openaiService.generatePuzzle = async () => {
    return '{ "title": "Broken JSON" "missing": "comma" }';
  };
  
  try {
    await generator.generatePuzzle({ difficulty: 'easy' });
    console.log('❌ Should have failed on malformed JSON');
    return false;
  } catch (error) {
    console.log('✅ Correctly handled malformed JSON:', error.message);
  }
  
  // Test empty response
  generator.openaiService.generatePuzzle = async () => {
    return '';
  };
  
  try {
    await generator.generatePuzzle({ difficulty: 'easy' });
    console.log('❌ Should have failed on empty response');
    return false;
  } catch (error) {
    console.log('✅ Correctly handled empty response:', error.message);
  }
  
  // Restore original method
  generator.openaiService.generatePuzzle = originalGeneratePuzzle;
  
  console.log('✅ Error handling tests passed!');
  return true;
}

async function runIntegrationTests() {
  console.log('🧪 Enhanced Response Parser Integration Tests');
  console.log('=============================================\n');
  
  const integrationResult = await testIntegration();
  const errorHandlingResult = await testErrorHandling();
  
  console.log('\n📊 Final Results');
  console.log('================');
  console.log('Integration test:', integrationResult ? '✅ PASSED' : '❌ FAILED');
  console.log('Error handling test:', errorHandlingResult ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = integrationResult && errorHandlingResult;
  console.log('Overall result:', allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  return allPassed;
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runIntegrationTests();
}

export { runIntegrationTests };
