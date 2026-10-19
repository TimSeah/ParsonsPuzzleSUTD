/**
 * Test verification service integration with puzzle generator
 */

import { PuzzleGenerator } from '../services/puzzleGenerator.js';

// Mock OpenAI service for testing
const mockOpenAIService = {
  isConfigured: () => true,
  getConfigurationError: () => null,
  generatePuzzle: async () => {
    return JSON.stringify({
      title: "Test Induction Proof: $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$",
      displayTitle: "Sum Formula Proof",
      statement: "Prove that $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$ for all positive integers $n$.",
      difficulty: "medium",
      category: "induction",
      tags: ["induction", "summation", "algebra"],
      blocks: [
        { id: "step1", latex: "Base case: For $n = 1$, $\\sum_{i=1}^{1} i = 1 = \\frac{1(1+1)}{2} = 1$. ✓" },
        { id: "step2", latex: "Inductive hypothesis: Assume $\\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}$ for some $k \\geq 1$." },
        { id: "step3", latex: "Inductive step: We need to prove $\\sum_{i=1}^{k+1} i = \\frac{(k+1)(k+2)}{2}$." },
        { id: "step4", latex: "$\\sum_{i=1}^{k+1} i = \\sum_{i=1}^{k} i + (k+1)$" },
        { id: "step5", latex: "By inductive hypothesis: $= \\frac{k(k+1)}{2} + (k+1)$" },
        { id: "step6", latex: "$= \\frac{k(k+1) + 2(k+1)}{2}$" },
        { id: "step7", latex: "$= \\frac{(k+1)(k + 2)}{2}$" },
        { id: "step8", latex: "Therefore, by mathematical induction, the formula holds for all $n \\geq 1$. ∎" }
      ],
      solutionOrder: ["step1", "step2", "step3", "step4", "step5", "step6", "step7", "step8"]
    });
  }
};

// Mock prompt builder for testing
const mockPromptBuilder = {
  createPuzzlePrompt: () => "Test prompt"
};

async function testVerificationIntegration() {
  console.log('🧪 Testing Verification Service Integration...\n');

  try {
    // Create puzzle generator with mocked dependencies
    const generator = new PuzzleGenerator();
    generator.openaiService = mockOpenAIService;
    generator.promptBuilder = mockPromptBuilder;

    console.log('📝 Generating puzzle with verification...');
    const puzzle = await generator.generatePuzzle({
      difficulty: 'medium',
      proofTypes: ['induction']
    });

    console.log('✅ Puzzle generated successfully!');
    console.log(`   ID: ${puzzle.id}`);
    console.log(`   Title: ${puzzle.displayTitle}`);
    console.log(`   Blocks: ${puzzle.blocks.length}`);
    console.log(`   Source: ${puzzle.source}`);

    // Check if verification result is included
    if (puzzle.verification) {
      console.log('\n🔍 Verification Results:');
      console.log(`   Valid: ${puzzle.verification.valid}`);
      console.log(`   Reason: ${puzzle.verification.reason}`);
      
      if (puzzle.verification.valid === true && 
          puzzle.verification.reason === 'Placeholder verification - LEAN integration pending') {
        console.log('✅ Verification service integration successful!');
        return true;
      } else {
        console.log('❌ Unexpected verification result');
        return false;
      }
    } else {
      console.log('❌ No verification result found in puzzle');
      return false;
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testVerificationIntegration().then(success => {
  if (success) {
    console.log('\n🎉 Verification integration test PASSED!');
    console.log('The LEAN verification service is properly integrated with puzzle generation.');
  } else {
    console.log('\n⚠️  Verification integration test FAILED!');
    console.log('Please check the integration between puzzle generator and verification service.');
  }
}).catch(error => {
  console.error('Test execution failed:', error);
});