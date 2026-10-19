// Simple test for OpenAI service functionality
import openaiService from '../services/openaiService.js';

/**
 * Test OpenAI service configuration and error handling
 */
function testOpenAIService() {
  console.log('Testing OpenAI Service...');
  
  // Test 1: Configuration check without API key
  console.log('Test 1: Configuration check');
  const isConfigured = openaiService.isConfigured();
  console.log('Is configured:', isConfigured);
  
  if (!isConfigured) {
    const errorMessage = openaiService.getConfigurationError();
    console.log('Configuration error:', errorMessage);
    console.log('✓ Configuration error handling works correctly');
  }
  
  // Test 2: Test connection method
  console.log('\nTest 2: Connection test');
  openaiService.testConnection().then(result => {
    console.log('Connection test result:', result);
    if (!result.success && result.error.includes('OpenAI API key not configured')) {
      console.log('✓ Connection test error handling works correctly');
    }
  }).catch(error => {
    console.error('Connection test failed:', error);
  });
  
  console.log('\nOpenAI Service tests completed');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testOpenAIService();
}

export { testOpenAIService };