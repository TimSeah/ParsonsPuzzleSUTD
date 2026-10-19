// Puzzle generator service that combines OpenAI API and prompt building
import openaiService from './openaiService.js';
import promptBuilder from './promptBuilder.js';
import leanVerificationService from './leanVerificationService.js';

/**
 * Service for generating puzzles using OpenAI API
 */
class PuzzleGenerator {
  constructor() {
    this.openaiService = openaiService;
    this.promptBuilder = promptBuilder;
    this.verificationService = leanVerificationService;
  }

  /**
   * Generate a puzzle based on user selections
   */
  async generatePuzzle(userSelections = {}) {
    // Check if OpenAI is configured
    if (!this.openaiService.isConfigured()) {
      throw new Error(this.openaiService.getConfigurationError());
    }

    try {
      // Build the prompt
      const prompt = this.promptBuilder.createPuzzlePrompt(userSelections);
      
      // Call OpenAI API
      const response = await this.openaiService.generatePuzzle(prompt);
      
      // Parse the response
      const puzzle = this.parseResponse(response);
      
      // Validate the puzzle structure
      this.validatePuzzle(puzzle);
      
      // Verify mathematical soundness
      const verificationResult = await this.verificationService.verifyPuzzleSoundness(puzzle);
      
      // Add metadata including verification result
      const completePuzzle = this.addMetadata(puzzle, verificationResult);
      
      return completePuzzle;
      
    } catch (error) {
      console.error('Puzzle generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Parse OpenAI response and extract puzzle data
   * Enhanced with comprehensive error handling and ID assignment
   */
  parseResponse(response) {
    try {
      // Validate response is not empty
      if (!response || typeof response !== 'string') {
        throw new Error('Empty or invalid response from OpenAI API');
      }

      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = response.trim();
      
      // Handle various response formats
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Remove any leading/trailing text that might not be JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart >= jsonEnd) {
        throw new Error('No valid JSON object found in response');
      }
      
      cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      
      // Parse JSON with detailed error handling
      let puzzle;
      try {
        puzzle = JSON.parse(cleanResponse);
      } catch (parseError) {
        throw new Error(`Invalid JSON format: ${parseError.message}`);
      }
      
      // Validate basic structure before processing
      if (!puzzle || typeof puzzle !== 'object') {
        throw new Error('Response is not a valid puzzle object');
      }
      
      // Clean LaTeX in all text fields
      puzzle = this.cleanLatexInPuzzle(puzzle);
      
      // Extract and validate puzzle components
      const extractedPuzzle = this.extractPuzzleComponents(puzzle);
      
      // Assign unique IDs to blocks if not present
      const puzzleWithIds = this.assignBlockIds(extractedPuzzle);
      
      // Generate or validate solution order
      const completePuzzle = this.generateSolutionOrder(puzzleWithIds);
      
      return completePuzzle;
      
    } catch (error) {
      console.error('Failed to parse OpenAI response:', {
        error: error.message,
        responseLength: response?.length || 0,
        responsePreview: response?.substring(0, 200) || 'No response'
      });
      
      // Provide descriptive error messages based on error type
      if (error.message.includes('JSON')) {
        throw new Error('Response contains malformed JSON. The AI generated invalid puzzle format.');
      } else if (error.message.includes('Empty')) {
        throw new Error('No response received from AI. Please try again.');
      } else if (error.message.includes('components')) {
        throw new Error(`Puzzle structure error: ${error.message}`);
      } else {
        throw new Error(`Failed to parse generated puzzle: ${error.message}`);
      }
    }
  }

  /**
   * Clean LaTeX syntax in puzzle to be compatible with KaTeX
   * Removes inline math delimiters like \( \) and \[ \] since KaTeX expects raw LaTeX
   */
  cleanLatexInPuzzle(puzzle) {
    const cleanLatex = (text) => {
      if (!text || typeof text !== 'string') return text;
      
      // Store original text for debugging
      const original = text;
      
      // Preserve spaces within \text{...} commands by temporarily replacing them
      const textCommandMatches = [];
      text = text.replace(/\\text\{([^}]*)\}/g, (match, content) => {
        const placeholder = `__TEXT_PLACEHOLDER_${textCommandMatches.length}__`;
        textCommandMatches.push(content);
        return placeholder;
      });
      
      // Remove inline math delimiters \( and \) but keep the content
      // Replace \( with space, content, space, and \) with space
      text = text.replace(/\\\(([^)]*)\\\)/g, ' $1 ');
      
      // Remove display math delimiters \[ and \]
      text = text.replace(/\\\[([^\]]*)\\\]/g, ' $1 ');
      
      // Remove $ delimiters (display math) but keep content
      text = text.replace(/\$\$([^$]*)\$\$/g, ' $1 ');
      
      // Remove single $ delimiters (inline math) but keep content
      text = text.replace(/\$([^$]+)\$/g, ' $1 ');
      
      // Clean up multiple spaces but preserve at least one space
      text = text.replace(/\s+/g, ' ').trim();
      
      // Restore \text{...} commands with their original spacing
      textCommandMatches.forEach((content, index) => {
        const placeholder = `__TEXT_PLACEHOLDER_${index}__`;
        text = text.replace(placeholder, `\\text{${content}}`);
      });
      
      // Log if significant changes were made
      if (original !== text && original.length > 20) {
        console.log('LaTeX cleaned:', {
          original: original.substring(0, 100),
          cleaned: text.substring(0, 100)
        });
      }
      
      return text;
    };
    
    // Clean title, displayTitle, and statement
    if (puzzle.title) puzzle.title = cleanLatex(puzzle.title);
    if (puzzle.displayTitle) puzzle.displayTitle = cleanLatex(puzzle.displayTitle);
    if (puzzle.statement) puzzle.statement = cleanLatex(puzzle.statement);
    
    // Clean all block latex content
    if (Array.isArray(puzzle.blocks)) {
      puzzle.blocks = puzzle.blocks.map(block => ({
        ...block,
        latex: cleanLatex(block.latex || block.content)
      }));
    }
    
    return puzzle;
  }

  /**
   * Extract and validate puzzle components from parsed JSON
   */
  extractPuzzleComponents(rawPuzzle) {
    const requiredFields = ['title', 'displayTitle', 'statement', 'difficulty', 'category', 'blocks'];
    const missingFields = [];
    
    // Check for required fields
    for (const field of requiredFields) {
      if (!rawPuzzle[field]) {
        missingFields.push(field);
      }
    }
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required puzzle components: ${missingFields.join(', ')}`);
    }
    
    // Validate blocks array
    if (!Array.isArray(rawPuzzle.blocks)) {
      throw new Error('Puzzle blocks must be an array');
    }
    
    if (rawPuzzle.blocks.length === 0) {
      throw new Error('Puzzle must contain at least one proof block');
    }
    
    // Validate each block has content
    for (let i = 0; i < rawPuzzle.blocks.length; i++) {
      const block = rawPuzzle.blocks[i];
      if (!block || typeof block !== 'object') {
        throw new Error(`Block ${i + 1} is not a valid object`);
      }
      if (!block.latex && !block.content) {
        throw new Error(`Block ${i + 1} missing content (latex or content field)`);
      }
    }
    
    return {
      title: rawPuzzle.title,
      displayTitle: rawPuzzle.displayTitle,
      statement: rawPuzzle.statement,
      difficulty: rawPuzzle.difficulty,
      category: rawPuzzle.category,
      tags: Array.isArray(rawPuzzle.tags) ? rawPuzzle.tags : [],
      blocks: rawPuzzle.blocks,
      solutionOrder: rawPuzzle.solutionOrder || null
    };
  }

  /**
   * Assign unique IDs to blocks if not present
   */
  assignBlockIds(puzzle) {
    const blocksWithIds = puzzle.blocks.map((block, index) => {
      // Use existing ID if present and valid, otherwise generate new one
      let blockId = block.id;
      
      if (!blockId || typeof blockId !== 'string' || blockId.trim() === '') {
        blockId = `block_${index + 1}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      }
      
      return {
        id: blockId,
        latex: block.latex || block.content || `Step ${index + 1}`
      };
    });
    
    // Check for duplicate IDs and fix them
    const usedIds = new Set();
    const finalBlocks = blocksWithIds.map((block) => {
      let uniqueId = block.id;
      let counter = 1;
      
      while (usedIds.has(uniqueId)) {
        uniqueId = `${block.id}_${counter}`;
        counter++;
      }
      
      usedIds.add(uniqueId);
      return { ...block, id: uniqueId };
    });
    
    return {
      ...puzzle,
      blocks: finalBlocks
    };
  }

  /**
   * Generate solution order array containing block IDs in sequence
   */
  generateSolutionOrder(puzzle) {
    let solutionOrder = puzzle.solutionOrder;
    
    // If solution order is not provided or invalid, generate sequential order
    if (!Array.isArray(solutionOrder) || solutionOrder.length === 0) {
      solutionOrder = puzzle.blocks.map(block => block.id);
    } else {
      // Validate existing solution order
      const blockIds = puzzle.blocks.map(b => b.id);
      const invalidIds = solutionOrder.filter(id => !blockIds.includes(id));
      
      if (invalidIds.length > 0) {
        console.warn('Solution order contains invalid block IDs:', invalidIds);
        // Generate new sequential order as fallback
        solutionOrder = puzzle.blocks.map(block => block.id);
      }
    }
    
    return {
      ...puzzle,
      solutionOrder
    };
  }

  /**
   * Validate puzzle structure matches requirements
   */
  validatePuzzle(puzzle) {
    // Check required properties
    const requiredProps = ['title', 'displayTitle', 'statement', 'difficulty', 'category', 'tags', 'blocks', 'solutionOrder'];
    
    for (const prop of requiredProps) {
      if (!puzzle[prop]) {
        throw new Error(`Generated puzzle missing required property: ${prop}`);
      }
    }

    // Validate blocks array
    if (!Array.isArray(puzzle.blocks)) {
      throw new Error('Puzzle blocks must be an array');
    }

    const blockLimits = {
      easy: { min: 4, max: 7 },
      medium: { min: 7, max: 10 },
      hard: { min: 9, max: 12 }
    };
    const limits = blockLimits[puzzle.difficulty];
    if (!limits || puzzle.blocks.length < limits.min || puzzle.blocks.length > limits.max) {
      const expected = limits ? `${limits.min}-${limits.max}` : 'a valid difficulty-specific number of';
      throw new Error(`Puzzle must have ${expected} proof blocks. Got ${puzzle.blocks.length} blocks.`);
    }

    // Validate each block has required properties
    for (const block of puzzle.blocks) {
      if (!block.id || !block.latex) {
        throw new Error('Each block must have an id and latex content');
      }
    }

    // Validate solution order
    if (!Array.isArray(puzzle.solutionOrder)) {
      throw new Error('Solution order must be an array');
    }

    if (puzzle.solutionOrder.length !== puzzle.blocks.length) {
      throw new Error('Solution order must match the number of blocks');
    }

    // Check that all solution order IDs reference actual blocks
    const blockIds = puzzle.blocks.map(b => b.id);
    for (const blockId of puzzle.solutionOrder) {
      if (!blockIds.includes(blockId)) {
        throw new Error(`Solution order references non-existent block ID: ${blockId}`);
      }
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(puzzle.difficulty)) {
      throw new Error(`Invalid difficulty: ${puzzle.difficulty}. Must be one of: ${validDifficulties.join(', ')}`);
    }

    // Validate category
    const validCategories = ['big-o', 'induction', 'set-theory', 'recursion', 'logic', 'combinatorics', 'graph-theory', 'data-structures'];
    if (!validCategories.includes(puzzle.category)) {
      throw new Error(`Invalid category: ${puzzle.category}. Must be one of: ${validCategories.join(', ')}`);
    }

    return true;
  }

  /**
   * Add metadata to the puzzle
   */
  addMetadata(puzzle, verificationResult = null) {
    const metadata = {
      ...puzzle,
      id: this.generatePuzzleId(),
      createdAt: new Date().toISOString(),
      isActive: true,
      source: 'llm-generated'
    };

    // Include verification result if provided
    if (verificationResult) {
      metadata.verification = verificationResult;
    }

    return metadata;
  }

  /**
   * Generate unique puzzle ID
   */
  generatePuzzleId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `llm_${timestamp}_${random}`;
  }

  /**
   * Test the puzzle generation system
   */
  async testGeneration() {
    try {
      const testSelections = {
        difficulty: 'easy',
        proofTypes: ['induction']
      };
      
      console.log('Testing puzzle generation with:', testSelections);
      const puzzle = await this.generatePuzzle(testSelections);
      
      console.log('Generated puzzle:', {
        id: puzzle.id,
        title: puzzle.displayTitle,
        difficulty: puzzle.difficulty,
        category: puzzle.category,
        blockCount: puzzle.blocks.length
      });
      
      return puzzle;
      
    } catch (error) {
      console.error('Test generation failed:', error.message);
      throw error;
    }
  }
}

// Create and export singleton instance
const puzzleGenerator = new PuzzleGenerator();
export default puzzleGenerator;

// Also export the class for testing
export { PuzzleGenerator };
