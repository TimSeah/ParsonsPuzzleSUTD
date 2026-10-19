/**
 * Test suite for response parser functionality
 * Tests the enhanced parseResponse method and related functions
 */

import { PuzzleGenerator } from '../services/puzzleGenerator.js';

// Create test instance
const generator = new PuzzleGenerator();

/**
 * Test data for various response scenarios
 */
const testResponses = {
  validResponse: `{
    "title": "Big O Proof Example",
    "displayTitle": "Big O Proof Example",
    "statement": "Prove that f(n) = n^2 is O(n^3)",
    "difficulty": "medium",
    "category": "big-o",
    "tags": ["complexity", "asymptotic", "proof"],
    "blocks": [
      {
        "id": "definition",
        "latex": "By definition, f(n) is in O(g(n)) if there exist constants c > 0 and n_0 > 0"
      },
      {
        "id": "setup",
        "latex": "We need to show that n^2 <= c * n^3 for some constants c and n_0"
      },
      {
        "id": "choose_constants",
        "latex": "Choose c = 1 and n_0 = 1"
      },
      {
        "id": "verify",
        "latex": "For n >= 1: n^2 <= n^3 since n >= 1"
      },
      {
        "id": "conclusion",
        "latex": "Therefore, f(n) = n^2 is in O(n^3) with c = 1 and n_0 = 1"
      }
    ],
    "solutionOrder": ["definition", "setup", "choose_constants", "verify", "conclusion"]
  }`,

  responseWithMarkdown: `\`\`\`json
{
  "title": "Induction Proof",
  "displayTitle": "Mathematical Induction Example",
  "statement": "Prove by induction that 1 + 2 + ... + n = n(n+1)/2",
  "difficulty": "easy",
  "category": "induction",
  "tags": ["induction", "summation"],
  "blocks": [
    {
      "latex": "Base case: For n = 1, LHS = 1, RHS = 1(1+1)/2 = 1. Base case holds."
    },
    {
      "latex": "Inductive hypothesis: Assume 1 + 2 + ... + k = k(k+1)/2 for some k >= 1"
    },
    {
      "latex": "Inductive step: Show 1 + 2 + ... + k + (k+1) = (k+1)(k+2)/2"
    }
  ]
}
\`\`\``,

  responseWithoutIds: `{
    "title": "Set Theory Proof",
    "displayTitle": "Set Union Properties",
    "statement": "Prove that A union (B intersect C) = (A union B) intersect (A union C)",
    "difficulty": "medium",
    "category": "set-theory",
    "tags": ["sets", "union", "intersection"],
    "blocks": [
      {
        "latex": "Let x be in A union (B intersect C)"
      },
      {
        "latex": "Then x is in A or x is in B intersect C"
      },
      {
        "latex": "Case 1: If x is in A, then x is in A union B and x is in A union C"
      }
    ]
  }`,

  malformedJson: `{
    "title": "Broken JSON"
    "displayTitle": "Missing comma",
    "blocks": [
      {"latex": "Step 1"}
    ]
  }`,

  emptyResponse: "",

  nonJsonResponse: "This is not a JSON response at all.",

  missingRequiredFields: `{
    "title": "Incomplete Puzzle",
    "blocks": [
      {"latex": "Only one field"}
    ]
  }`,

  invalidBlocks: `{
    "title": "Invalid Blocks Test",
    "displayTitle": "Test",
    "statement": "Test statement",
    "difficulty": "easy",
    "category": "logic",
    "blocks": "not an array"
  }`,

  emptyBlocks: `{
    "title": "Empty Blocks Test",
    "displayTitle": "Test",
    "statement": "Test statement", 
    "difficulty": "easy",
    "category": "logic",
    "blocks": []
  }`
};

/**
 * Test functions
 */

function testValidResponse() {
  console.log('\n=== Testing Valid Response ===');
  try {
    const result = generator.parseResponse(testResponses.validResponse);
    console.log('✓ Successfully parsed valid response');
    console.log('Puzzle title:', result.displayTitle);
    console.log('Block count:', result.blocks.length);
    console.log('All blocks have IDs:', result.blocks.every(b => b.id));
    console.log('Solution order length:', result.solutionOrder.length);
    console.log('Solution order matches blocks:', result.solutionOrder.length === result.blocks.length);
    return true;
  } catch (error) {
    console.error('✗ Failed to parse valid response:', error.message);
    return false;
  }
}

function testMarkdownResponse() {
  console.log('\n=== Testing Markdown Response ===');
  try {
    const result = generator.parseResponse(testResponses.responseWithMarkdown);
    console.log('✓ Successfully parsed markdown-wrapped response');
    console.log('Puzzle title:', result.displayTitle);
    console.log('Block count:', result.blocks.length);
    return true;
  } catch (error) {
    console.error('✗ Failed to parse markdown response:', error.message);
    return false;
  }
}

function testResponseWithoutIds() {
  console.log('\n=== Testing Response Without Block IDs ===');
  try {
    const result = generator.parseResponse(testResponses.responseWithoutIds);
    console.log('✓ Successfully parsed response without IDs');
    console.log('Generated IDs:', result.blocks.map(b => b.id));
    console.log('All blocks have unique IDs:', new Set(result.blocks.map(b => b.id)).size === result.blocks.length);
    console.log('Solution order generated:', result.solutionOrder);
    return true;
  } catch (error) {
    console.error('✗ Failed to parse response without IDs:', error.message);
    return false;
  }
}

function testMalformedJson() {
  console.log('\n=== Testing Malformed JSON ===');
  try {
    generator.parseResponse(testResponses.malformedJson);
    console.error('✗ Should have failed on malformed JSON');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected malformed JSON:', error.message);
    return true;
  }
}

function testEmptyResponse() {
  console.log('\n=== Testing Empty Response ===');
  try {
    generator.parseResponse(testResponses.emptyResponse);
    console.error('✗ Should have failed on empty response');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected empty response:', error.message);
    return true;
  }
}

function testNonJsonResponse() {
  console.log('\n=== Testing Non-JSON Response ===');
  try {
    generator.parseResponse(testResponses.nonJsonResponse);
    console.error('✗ Should have failed on non-JSON response');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected non-JSON response:', error.message);
    return true;
  }
}

function testMissingRequiredFields() {
  console.log('\n=== Testing Missing Required Fields ===');
  try {
    generator.parseResponse(testResponses.missingRequiredFields);
    console.error('✗ Should have failed on missing required fields');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected response with missing fields:', error.message);
    return true;
  }
}

function testInvalidBlocks() {
  console.log('\n=== Testing Invalid Blocks ===');
  try {
    generator.parseResponse(testResponses.invalidBlocks);
    console.error('✗ Should have failed on invalid blocks');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected invalid blocks:', error.message);
    return true;
  }
}

function testEmptyBlocks() {
  console.log('\n=== Testing Empty Blocks Array ===');
  try {
    generator.parseResponse(testResponses.emptyBlocks);
    console.error('✗ Should have failed on empty blocks array');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected empty blocks array:', error.message);
    return true;
  }
}

function testBlockValidation() {
  console.log('\n=== Testing Block Count Validation ===');
  
  // Test puzzle with too few blocks (< 8)
  const tooFewBlocks = {
    title: "Test",
    displayTitle: "Test",
    statement: "Test statement",
    difficulty: "easy",
    category: "logic",
    tags: [],
    blocks: [
      { id: "1", latex: "Step 1" },
      { id: "2", latex: "Step 2" }
    ]
  };
  
  try {
    const puzzle = generator.parseResponse(JSON.stringify(tooFewBlocks));
    generator.validatePuzzle(puzzle);
    console.error('✗ Should have failed validation for too few blocks');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected puzzle with too few blocks:', error.message);
  }
  
  // Test puzzle with too many blocks (> 12)
  const tooManyBlocks = {
    title: "Test",
    displayTitle: "Test", 
    statement: "Test statement",
    difficulty: "easy",
    category: "logic",
    tags: [],
    blocks: Array.from({ length: 15 }, (_, i) => ({ id: `${i + 1}`, latex: `Step ${i + 1}` }))
  };
  
  try {
    const puzzle = generator.parseResponse(JSON.stringify(tooManyBlocks));
    generator.validatePuzzle(puzzle);
    console.error('✗ Should have failed validation for too many blocks');
    return false;
  } catch (error) {
    console.log('✓ Correctly rejected puzzle with too many blocks:', error.message);
  }
  
  return true;
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('🧪 Running Response Parser Tests');
  console.log('================================');
  
  const tests = [
    testValidResponse,
    testMarkdownResponse,
    testResponseWithoutIds,
    testMalformedJson,
    testEmptyResponse,
    testNonJsonResponse,
    testMissingRequiredFields,
    testInvalidBlocks,
    testEmptyBlocks,
    testBlockValidation
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Test threw unexpected error:', error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results');
  console.log('===============');
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('❌ Some tests failed. Check the output above.');
  }
  
  return failed === 0;
}

// Export for use in other test files
export { runAllTests, testResponses };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}