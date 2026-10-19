/**
 * Test suite for LEAN Verification Service
 */

import leanVerificationService, { LeanVerificationService } from '../services/leanVerificationService.js';

// Test data - valid puzzle structure
const validPuzzle = {
  id: 'test-puzzle-1',
  title: 'Test Induction Proof',
  displayTitle: 'Test Induction Proof',
  statement: 'Prove that $\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}$ for all $n \\geq 1$',
  category: 'induction',
  difficulty: 'medium',
  tags: ['induction', 'summation'],
  blocks: [
    { id: 'block-1', latex: 'Base case: For $n = 1$, $\\sum_{i=1}^{1} i = 1 = \\frac{1(1+1)}{2}$' },
    { id: 'block-2', latex: 'Inductive hypothesis: Assume $\\sum_{i=1}^{k} i = \\frac{k(k+1)}{2}$ for some $k \\geq 1$' },
    { id: 'block-3', latex: 'Inductive step: $\\sum_{i=1}^{k+1} i = \\sum_{i=1}^{k} i + (k+1)$' },
    { id: 'block-4', latex: 'By inductive hypothesis: $= \\frac{k(k+1)}{2} + (k+1)$' },
    { id: 'block-5', latex: 'Simplifying: $= \\frac{k(k+1) + 2(k+1)}{2} = \\frac{(k+1)(k+2)}{2}$' }
  ],
  solutionOrder: ['block-1', 'block-2', 'block-3', 'block-4', 'block-5'],
  createdAt: new Date().toISOString(),
  isActive: true
};

// Test data - invalid puzzle structures
const invalidPuzzles = {
  nullPuzzle: null,
  emptyObject: {},
  missingBlocks: {
    id: 'test-2',
    title: 'Test',
    statement: 'Test statement',
    solutionOrder: []
  },
  emptyBlocks: {
    id: 'test-3',
    title: 'Test',
    statement: 'Test statement',
    blocks: [],
    solutionOrder: []
  },
  invalidBlockStructure: {
    id: 'test-4',
    title: 'Test',
    statement: 'Test statement',
    blocks: [{ id: 'block-1' }], // missing latex property
    solutionOrder: ['block-1']
  },
  mismatchedSolutionOrder: {
    id: 'test-5',
    title: 'Test',
    statement: 'Test statement',
    blocks: [
      { id: 'block-1', latex: 'Step 1' },
      { id: 'block-2', latex: 'Step 2' }
    ],
    solutionOrder: ['block-1'] // missing block-2
  }
};

/**
 * Test runner function
 */
async function runTests() {
  console.log('🧪 Running LEAN Verification Service Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Valid puzzle should return success
  try {
    console.log('Test 1: Valid puzzle verification');
    const result = await leanVerificationService.verifyPuzzleSoundness(validPuzzle);
    
    if (result.valid === true && result.reason === 'Placeholder verification - LEAN integration pending') {
      console.log('✅ PASSED: Valid puzzle returns success');
      passed++;
    } else {
      console.log('❌ FAILED: Valid puzzle should return success');
      console.log('  Expected: { valid: true, reason: "Placeholder verification - LEAN integration pending" }');
      console.log('  Actual:', result);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Valid puzzle test threw error:', error.message);
    failed++;
  }

  // Test 2: Invalid puzzle structures should return failure
  for (const [testName, invalidPuzzle] of Object.entries(invalidPuzzles)) {
    try {
      console.log(`\nTest 2.${Object.keys(invalidPuzzles).indexOf(testName) + 1}: Invalid puzzle - ${testName}`);
      const result = await leanVerificationService.verifyPuzzleSoundness(invalidPuzzle);
      
      if (result.valid === false && result.reason.includes('Invalid puzzle structure')) {
        console.log('✅ PASSED: Invalid puzzle returns failure');
        passed++;
      } else {
        console.log('❌ FAILED: Invalid puzzle should return failure');
        console.log('  Expected: { valid: false, reason: "Invalid puzzle structure: ..." }');
        console.log('  Actual:', result);
        failed++;
      }
    } catch (error) {
      console.log('❌ FAILED: Invalid puzzle test threw error:', error.message);
      failed++;
    }
  }

  // Test 3: Service should complete within timeout
  try {
    console.log('\nTest 3: Verification timeout performance');
    const startTime = Date.now();
    await leanVerificationService.verifyPuzzleSoundness(validPuzzle);
    const duration = Date.now() - startTime;
    
    if (duration < 5000) {
      console.log(`✅ PASSED: Verification completed in ${duration}ms (under 5s timeout)`);
      passed++;
    } else {
      console.log(`❌ FAILED: Verification took ${duration}ms (exceeds 5s timeout)`);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Timeout test threw error:', error.message);
    failed++;
  }

  // Test 4: Service instance should be properly configured
  try {
    console.log('\nTest 4: Service configuration');
    const service = new LeanVerificationService();
    
    if (service.verificationTimeout === 5000 && typeof service.leanServerEndpoint === 'string') {
      console.log('✅ PASSED: Service properly configured');
      passed++;
    } else {
      console.log('❌ FAILED: Service configuration incorrect');
      console.log('  Expected timeout: 5000, endpoint: string');
      console.log('  Actual timeout:', service.verificationTimeout, 'endpoint:', service.leanServerEndpoint);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Configuration test threw error:', error.message);
    failed++;
  }

  // Test summary
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! LEAN Verification Service is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
  }

  return { passed, failed };
}

// Export for use in other test files
export { runTests, validPuzzle, invalidPuzzles };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}