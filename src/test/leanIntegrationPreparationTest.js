/**
 * Test suite for LEAN Integration Preparation Features
 * Tests the enhanced configuration and error handling added in task 7.2
 */

import { LeanVerificationService, LEAN_CONFIG } from '../services/leanVerificationService.js';

/**
 * Test runner for LEAN integration preparation features
 */
async function runLeanIntegrationTests() {
  console.log('🔧 Running LEAN Integration Preparation Tests...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Enhanced configuration properties
  try {
    console.log('Test 1: Enhanced service configuration');
    const service = new LeanVerificationService();
    
    const hasEnhancedConfig = (
      typeof service.leanSyntaxCheckEndpoint === 'string' &&
      typeof service.maxRetryAttempts === 'number' &&
      typeof service.retryDelay === 'number' &&
      typeof service.leanVersion === 'string' &&
      typeof service.mathLibVersion === 'string' &&
      typeof service.enableDebugMode === 'boolean' &&
      typeof service.timeoutErrorMessage === 'string' &&
      typeof service.networkErrorMessage === 'string' &&
      typeof service.compilationErrorPrefix === 'string'
    );
    
    if (hasEnhancedConfig) {
      console.log('✅ PASSED: Enhanced configuration properties present');
      passed++;
    } else {
      console.log('❌ FAILED: Missing enhanced configuration properties');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Enhanced configuration test threw error:', error.message);
    failed++;
  }

  // Test 2: LEAN_CONFIG constants export
  try {
    console.log('\nTest 2: LEAN_CONFIG constants');
    
    const hasRequiredConstants = (
      LEAN_CONFIG.ENDPOINTS &&
      LEAN_CONFIG.TIMEOUTS &&
      LEAN_CONFIG.ERROR_CODES &&
      LEAN_CONFIG.SYMBOL_MAPPING &&
      typeof LEAN_CONFIG.ENDPOINTS.VERIFY === 'string' &&
      typeof LEAN_CONFIG.TIMEOUTS.VERIFICATION === 'number' &&
      typeof LEAN_CONFIG.ERROR_CODES.TIMEOUT === 'string' &&
      typeof LEAN_CONFIG.SYMBOL_MAPPING['\\forall'] === 'string'
    );
    
    if (hasRequiredConstants) {
      console.log('✅ PASSED: LEAN_CONFIG constants properly exported');
      passed++;
    } else {
      console.log('❌ FAILED: LEAN_CONFIG constants missing or malformed');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: LEAN_CONFIG test threw error:', error.message);
    failed++;
  }

  // Test 3: Symbol mapping completeness
  try {
    console.log('\nTest 3: LaTeX to LEAN symbol mapping');
    
    const requiredSymbols = [
      '\\forall', '\\exists', '\\rightarrow', '\\leftrightarrow',
      '\\land', '\\lor', '\\neg', '\\cup', '\\cap', '\\subseteq',
      '\\in', '\\emptyset', '\\mathbb{N}', '\\mathbb{Z}', '\\mathbb{R}'
    ];
    
    const allSymbolsPresent = requiredSymbols.every(symbol => 
      LEAN_CONFIG.SYMBOL_MAPPING[symbol] !== undefined
    );
    
    if (allSymbolsPresent) {
      console.log('✅ PASSED: All required LaTeX symbols mapped to LEAN');
      passed++;
    } else {
      console.log('❌ FAILED: Missing required symbol mappings');
      const missing = requiredSymbols.filter(symbol => 
        LEAN_CONFIG.SYMBOL_MAPPING[symbol] === undefined
      );
      console.log('  Missing symbols:', missing);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Symbol mapping test threw error:', error.message);
    failed++;
  }

  // Test 4: Error handling configuration
  try {
    console.log('\nTest 4: Error handling configuration');
    
    const requiredErrorCodes = [
      'LEAN_TIMEOUT', 'LEAN_NETWORK_ERROR', 'LEAN_COMPILATION_ERROR',
      'LEAN_SYNTAX_ERROR', 'LEAN_SERVER_ERROR', 'LEAN_INVALID_PROOF'
    ];
    
    const allErrorCodesPresent = requiredErrorCodes.every(code =>
      Object.values(LEAN_CONFIG.ERROR_CODES).includes(code)
    );
    
    if (allErrorCodesPresent) {
      console.log('✅ PASSED: All required error codes defined');
      passed++;
    } else {
      console.log('❌ FAILED: Missing required error codes');
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Error codes test threw error:', error.message);
    failed++;
  }

  // Test 5: Timeout configurations
  try {
    console.log('\nTest 5: Timeout configurations');
    
    const timeouts = LEAN_CONFIG.TIMEOUTS;
    const validTimeouts = (
      timeouts.VERIFICATION === 5000 &&
      timeouts.SYNTAX_CHECK === 2000 &&
      timeouts.COMPILATION === 10000 &&
      timeouts.HEALTH_CHECK === 1000
    );
    
    if (validTimeouts) {
      console.log('✅ PASSED: Timeout configurations are correct');
      passed++;
    } else {
      console.log('❌ FAILED: Incorrect timeout configurations');
      console.log('  Expected: VERIFICATION=5000, SYNTAX_CHECK=2000, COMPILATION=10000, HEALTH_CHECK=1000');
      console.log('  Actual:', timeouts);
      failed++;
    }
  } catch (error) {
    console.log('❌ FAILED: Timeout configuration test threw error:', error.message);
    failed++;
  }

  // Test summary
  console.log('\n📊 LEAN Integration Preparation Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All LEAN integration preparation tests passed!');
    console.log('   The service is ready for future LEAN integration.');
  } else {
    console.log('\n⚠️  Some preparation tests failed. Please review the implementation.');
  }

  return { passed, failed };
}

// Export for use in other test files
export { runLeanIntegrationTests };

// Run tests if this file is executed directly
if (import.meta.url === new URL(import.meta.resolve('./leanIntegrationPreparationTest.js')).href) {
  runLeanIntegrationTests().catch(console.error);
}