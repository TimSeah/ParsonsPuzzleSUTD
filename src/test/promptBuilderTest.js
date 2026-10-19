/**
 * Test suite for enhanced prompt builder functionality
 * Tests tag injection and prompt customization features
 */

import promptBuilder from '../services/promptBuilder.js';

/**
 * Test difficulty injection functionality
 */
function testDifficultyInjection() {
  console.log('\n=== Testing Difficulty Injection ===');
  
  // Test easy difficulty
  const easyPrompt = promptBuilder.createPuzzlePrompt({ difficulty: 'easy' });
  const hasEasyGuidance = easyPrompt.includes('DIFFICULTY LEVEL: EASY') && 
                         easyPrompt.includes('fundamental concepts') &&
                         easyPrompt.includes('4-7 proof blocks');
  console.log('✓ Easy difficulty injection:', hasEasyGuidance ? 'PASS' : 'FAIL');
  
  // Test medium difficulty (default)
  const mediumPrompt = promptBuilder.createPuzzlePrompt({ difficulty: 'medium' });
  const hasMediumGuidance = mediumPrompt.includes('DIFFICULTY LEVEL: MEDIUM') &&
                           mediumPrompt.includes('intermediate mathematical concepts') &&
                           mediumPrompt.includes('7-10 proof blocks');
  console.log('✓ Medium difficulty injection:', hasMediumGuidance ? 'PASS' : 'FAIL');
  
  // Test hard difficulty
  const hardPrompt = promptBuilder.createPuzzlePrompt({ difficulty: 'hard' });
  const hasHardGuidance = hardPrompt.includes('DIFFICULTY LEVEL: HARD') &&
                         hardPrompt.includes('advanced mathematical concepts') &&
                         hardPrompt.includes('9-12 proof blocks');
  console.log('✓ Hard difficulty injection:', hasHardGuidance ? 'PASS' : 'FAIL');
  
  return hasEasyGuidance && hasMediumGuidance && hasHardGuidance;
}

/**
 * Test proof type emphasis functionality
 */
function testProofTypeEmphasis() {
  console.log('\n=== Testing Proof Type Emphasis ===');
  
  // Test single proof type
  const inductionPrompt = promptBuilder.createPuzzlePrompt({ 
    proofTypes: ['induction'] 
  });
  const hasInductionEmphasis = inductionPrompt.includes('Generate a induction proof puzzle') &&
                              inductionPrompt.includes('For Induction proofs') &&
                              inductionPrompt.includes('base case, inductive hypothesis');
  console.log('✓ Single proof type emphasis:', hasInductionEmphasis ? 'PASS' : 'FAIL');
  
  // Test multiple proof types
  const multipleTypesPrompt = promptBuilder.createPuzzlePrompt({ 
    proofTypes: ['big-o', 'set-theory', 'logic'] 
  });
  const hasMultipleEmphasis = multipleTypesPrompt.includes('Focus on big-o, set-theory, or logic') &&
                             multipleTypesPrompt.includes('For Big O proofs') &&
                             multipleTypesPrompt.includes('For Set Theory proofs') &&
                             multipleTypesPrompt.includes('For Logic proofs');
  console.log('✓ Multiple proof types emphasis:', hasMultipleEmphasis ? 'PASS' : 'FAIL');
  
  // Test random/no selection
  const randomPrompt = promptBuilder.createPuzzlePrompt({ proofTypes: [] });
  const hasRandomHandling = randomPrompt.includes('Choose any appropriate proof type');
  console.log('✓ Random proof type handling:', hasRandomHandling ? 'PASS' : 'FAIL');
  
  return hasInductionEmphasis && hasMultipleEmphasis && hasRandomHandling;
}

/**
 * Test default value handling
 */
function testDefaultValueHandling() {
  console.log('\n=== Testing Default Value Handling ===');
  
  // Test completely empty selections
  const emptyPrompt = promptBuilder.createPuzzlePrompt({});
  const hasDefaults = emptyPrompt.includes('DIFFICULTY LEVEL: MEDIUM') &&
                     emptyPrompt.includes('Choose any appropriate proof type');
  console.log('✓ Empty selections use defaults:', hasDefaults ? 'PASS' : 'FAIL');
  
  // Test invalid difficulty
  const invalidDifficultyPrompt = promptBuilder.createPuzzlePrompt({ 
    difficulty: 'invalid' 
  });
  const defaultsToMedium = invalidDifficultyPrompt.includes('DIFFICULTY LEVEL: MEDIUM');
  console.log('✓ Invalid difficulty defaults to medium:', defaultsToMedium ? 'PASS' : 'FAIL');
  
  // Test invalid proof types
  const invalidTypesPrompt = promptBuilder.createPuzzlePrompt({ 
    proofTypes: ['invalid-type', 'another-invalid'] 
  });
  const defaultsToRandom = invalidTypesPrompt.includes('Choose any appropriate proof type');
  console.log('✓ Invalid proof types default to random:', defaultsToRandom ? 'PASS' : 'FAIL');
  
  return hasDefaults && defaultsToMedium && defaultsToRandom;
}

/**
 * Test validation and normalization
 */
function testValidationAndNormalization() {
  console.log('\n=== Testing Validation and Normalization ===');
  
  // Test validation result structure
  const result = promptBuilder.validateAndNormalizeSelections('easy', ['induction', 'invalid-type']);
  
  const hasCorrectStructure = result.difficulty === 'easy' &&
                             Array.isArray(result.proofTypes) &&
                             result.proofTypes.includes('induction') &&
                             !result.proofTypes.includes('invalid-type') &&
                             typeof result.hasValidSelections === 'object';
  console.log('✓ Validation result structure:', hasCorrectStructure ? 'PASS' : 'FAIL');
  
  // Test validation flags
  const hasValidFlags = result.hasValidSelections.difficulty === true &&
                       result.hasValidSelections.proofTypes === true;
  console.log('✓ Validation flags accuracy:', hasValidFlags ? 'PASS' : 'FAIL');
  
  return hasCorrectStructure && hasValidFlags;
}

/**
 * Test combined functionality
 */
function testCombinedFunctionality() {
  console.log('\n=== Testing Combined Functionality ===');
  
  // Test complex selection combination
  const complexPrompt = promptBuilder.createPuzzlePrompt({
    difficulty: 'hard',
    proofTypes: ['induction', 'combinatorics'],
    additionalTags: ['fibonacci', 'sequences']
  });
  
  const hasAllFeatures = complexPrompt.includes('DIFFICULTY LEVEL: HARD') &&
                        complexPrompt.includes('Focus on induction, or combinatorics') &&
                        complexPrompt.includes('For Induction proofs') &&
                        complexPrompt.includes('For Combinatorics proofs') &&
                        complexPrompt.includes('fibonacci, sequences');
  console.log('✓ Combined functionality:', hasAllFeatures ? 'PASS' : 'FAIL');
  
  return hasAllFeatures;
}

/**
 * Run all prompt builder tests
 */
function runPromptBuilderTests() {
  console.log('🧪 Running Enhanced Prompt Builder Tests');
  console.log('==========================================');
  
  const results = [
    testDifficultyInjection(),
    testProofTypeEmphasis(),
    testDefaultValueHandling(),
    testValidationAndNormalization(),
    testCombinedFunctionality()
  ];
  
  const passedTests = results.filter(result => result).length;
  const totalTests = results.length;
  
  console.log('\n📊 Test Results Summary');
  console.log('======================');
  console.log(`Passed: ${passedTests}/${totalTests}`);
  console.log(`Status: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 Enhanced prompt builder is working correctly!');
    console.log('✓ Tag injection implemented');
    console.log('✓ Prompt customization working');
    console.log('✓ Default value handling functional');
    console.log('✓ Requirements 13.8, 13.9, 13.10, 13.11, 13.12 satisfied');
  }
  
  return passedTests === totalTests;
}

// Export for use in other test files
export { runPromptBuilderTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!runPromptBuilderTests()) process.exitCode = 1;
}
