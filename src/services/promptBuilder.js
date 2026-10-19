/**
 * Prompt builder service for OpenAI puzzle generation
 * Constructs structured prompts based on user selections
 */
class PromptBuilder {
  constructor() {
    this.basePrompt = this.createBasePrompt();
  }

  /**
   * Create the base prompt template with format specification and rules
   */
  createBasePrompt() {
    return `You are an expert mathematics educator creating Parsons puzzles for students learning mathematical proofs. Generate a single, unique mathematical proof puzzle in the exact JSON format specified below.

OUTPUT FORMAT:
{
  "title": "LaTeX-formatted title with mathematical notation",
  "displayTitle": "Plain text title for UI display",
  "statement": "LaTeX-formatted problem statement",
  "difficulty": "easy|medium|hard",
  "category": "big-o|induction|set-theory|recursion|logic|combinatorics|graph-theory|data-structures",
  "tags": ["array", "of", "relevant", "tags"],
  "blocks": [
    {
      "id": "unique_block_id",
      "latex": "LaTeX-formatted proof step"
    }
  ],
  "solutionOrder": ["array", "of", "block", "ids", "in", "correct", "order"]
}

RULES:
1. Follow the difficulty-specific proof-block limits below
2. Each block must be a self-contained logical step
3. Use valid LaTeX syntax for all mathematical notation
4. Proofs must be logically complete and mathematically valid
5. Each block must have a unique ID (use descriptive names like "premise1", "step2", etc.)
6. The solutionOrder array must contain all block IDs in the correct logical sequence
7. Include appropriate mathematical symbols, equations, and formatting
8. Ensure the proof follows standard mathematical conventions

TOPIC IDEAS:
1. Big O Notation: Asymptotic analysis, growth rates, complexity comparisons
2. Mathematical Induction: Base case, inductive step, strong induction
3. Set Theory: Union, intersection, complement, subset proofs
4. Recursion: Recurrence relations, recursive algorithms, correctness proofs
5. Logic: Propositional logic, predicate logic, proof by contradiction
6. Combinatorics: Permutations, combinations, counting principles
7. Graph Theory: Connectivity, paths, trees, graph properties`;
  }

  /**
   * Build a customized prompt based on user selections
   */
  buildPrompt(difficulty = 'medium', proofTypes = [], additionalTags = []) {
    let customPrompt = this.basePrompt;
    
    // Inject difficulty selection into prompt (Requirement 13.8)
    customPrompt += this.injectDifficultySpecification(difficulty);
    
    // Emphasize selected proof types in prompt (Requirement 13.9)
    customPrompt += this.emphasizeProofTypes(proofTypes);
    
    // Add additional topic focus if provided
    if (additionalTags && additionalTags.length > 0) {
      customPrompt += this.addTopicFocus(additionalTags);
    }
    
    // Add final instruction
    customPrompt += '\n\nGenerate exactly one unique puzzle following all specifications above. Return only the JSON object, no additional text.';
    
    return customPrompt;
  }

  /**
   * Inject difficulty specification into prompt with detailed guidance
   * Requirement 13.8: Inject user difficulty selection into prompt
   */
  injectDifficultySpecification(difficulty) {
    let difficultySection = `\n\nDIFFICULTY LEVEL: ${difficulty.toUpperCase()}`;
    
    switch (difficulty) {
      case 'easy':
        difficultySection += `
- Use fundamental concepts and basic mathematical operations
- Limit to 4-7 proof blocks for shorter, more manageable proofs
- Focus on direct proof techniques and simple logical steps
- Avoid complex nested reasoning or advanced mathematical concepts
- Use clear, straightforward mathematical notation
- Include more explanatory steps to guide student understanding`;
        break;
        
      case 'medium':
        difficultySection += `
- Use intermediate mathematical concepts and standard proof techniques
- Target 7-10 proof blocks for moderate complexity
- Include some multi-step reasoning and standard mathematical arguments
- Balance between accessibility and mathematical rigor
- Use standard mathematical notation and common proof patterns
- Require some mathematical insight but remain approachable`;
        break;
        
      case 'hard':
        difficultySection += `
- Use advanced mathematical concepts and sophisticated proof techniques
- Target 9-12 proof blocks for complex, multi-layered arguments
- Include intricate logical reasoning and advanced mathematical methods
- Require deep mathematical insight and careful logical analysis
- Use sophisticated mathematical notation and advanced proof strategies
- Challenge students with non-obvious steps and complex relationships`;
        break;
        
      default:
        // Default to medium if invalid difficulty provided
        difficultySection += `
- Use intermediate mathematical concepts and standard proof techniques
- Target 9-11 proof blocks for moderate complexity
- Include some multi-step reasoning and standard mathematical arguments`;
    }
    
    return difficultySection;
  }

  /**
   * Emphasize selected proof types in prompt with specific guidance
   * Requirement 13.9: Emphasize selected proof types in prompt
   */
  emphasizeProofTypes(proofTypes) {
    if (!proofTypes || proofTypes.length === 0 || proofTypes.includes('random')) {
      return '\n\nPROOF TYPE: Choose any appropriate proof type from the available categories.';
    }
    
    let typeSection = '\n\nPROOF TYPE FOCUS: ';
    
    if (proofTypes.length === 1) {
      typeSection += `Generate a ${proofTypes[0]} proof puzzle.`;
    } else {
      const typeList = proofTypes.slice(0, -1).join(', ');
      const lastType = proofTypes[proofTypes.length - 1];
      typeSection += `Focus on ${typeList}, or ${lastType} proof techniques. Choose one of these types.`;
    }
    
    // Add specific guidance for each proof type
    typeSection += this.getProofTypeGuidance(proofTypes);
    
    return typeSection;
  }

  /**
   * Get specific guidance for proof types
   * Requirement 13.10: Handle specific proof type emphasis
   */
  getProofTypeGuidance(proofTypes) {
    let guidance = '\n\nSPECIFIC GUIDANCE:';
    
    for (const type of proofTypes) {
      switch (type) {
        case 'big-o':
          guidance += '\n- For Big O proofs: Include asymptotic analysis, growth rate comparisons, and complexity bounds';
          break;
        case 'induction':
          guidance += '\n- For Induction proofs: Include clear base case, inductive hypothesis, and inductive step';
          break;
        case 'set-theory':
          guidance += '\n- For Set Theory proofs: Include set operations, membership proofs, and subset relationships';
          break;
        case 'recursion':
          guidance += '\n- For Recursion proofs: Include recursive definitions, base cases, and recursive step analysis';
          break;
        case 'logic':
          guidance += '\n- For Logic proofs: Include logical operators, truth tables, and formal logical reasoning';
          break;
        case 'combinatorics':
          guidance += '\n- For Combinatorics proofs: Include counting principles, permutations, and combinatorial identities';
          break;
        case 'graph-theory':
          guidance += '\n- For Graph Theory proofs: Include graph properties, connectivity, and structural analysis';
          break;
        case 'data-structures':
          guidance += '\n- For Data Structures proofs: Prove an invariant or correctness property for heaps, stacks, queues, linked lists, trees, Dijkstra, or Bellman-Ford; state all preconditions explicitly';
          break;
      }
    }
    
    return guidance;
  }

  /**
   * Add topic focus for additional tags
   */
  addTopicFocus(additionalTags) {
    const tagList = additionalTags.join(', ');
    return `\n\nADDITIONAL FOCUS: Incorporate concepts related to: ${tagList}`;
  }

  /**
   * Validate user selections and provide defaults
   * Requirements 13.11, 13.12: Handle default values when no selections made
   */
  validateAndNormalizeSelections(difficulty, proofTypes) {
    // Normalize difficulty - always provide a valid difficulty (Requirement 13.11)
    const validDifficulties = ['easy', 'medium', 'hard'];
    let normalizedDifficulty;
    
    if (difficulty && validDifficulties.includes(difficulty)) {
      normalizedDifficulty = difficulty;
    } else {
      // Default to medium when no valid difficulty selected (Requirement 1.11)
      normalizedDifficulty = 'medium';
    }
    
    // Normalize proof types with intelligent defaults (Requirement 13.12)
    const validProofTypes = ['big-o', 'induction', 'set-theory', 'recursion', 'logic', 'combinatorics', 'graph-theory', 'data-structures'];
    let normalizedProofTypes = [];
    
    if (Array.isArray(proofTypes) && proofTypes.length > 0) {
      // Filter to only valid proof types
      normalizedProofTypes = proofTypes.filter(type => validProofTypes.includes(type));
    }
    
    // Handle case where no valid proof types selected (Requirement 2.10, 13.12)
    if (normalizedProofTypes.length === 0) {
      // Use 'random' to indicate the LLM should choose any appropriate type
      normalizedProofTypes = ['random'];
    }
    
    return {
      difficulty: normalizedDifficulty,
      proofTypes: normalizedProofTypes,
      hasValidSelections: {
        difficulty: difficulty && validDifficulties.includes(difficulty),
        proofTypes: Array.isArray(proofTypes) && proofTypes.length > 0 && 
                   proofTypes.some(type => validProofTypes.includes(type))
      }
    };
  }

  /**
   * Map display labels to internal identifiers
   */
  mapProofTypeLabels(displayLabels) {
    const labelMap = {
      'Big O': 'big-o',
      'Induction': 'induction',
      'Set Theory': 'set-theory',
      'Recursion': 'recursion',
      'Logic': 'logic',
      'Combinatorics': 'combinatorics',
      'Graph Theory': 'graph-theory',
      'Data Structures': 'data-structures'
    };
    
    return displayLabels.map(label => labelMap[label] || label.toLowerCase().replace(/\s+/g, '-'));
  }

  /**
   * Create a complete prompt for puzzle generation
   * Integrates all user selections with proper defaults and validation
   */
  createPuzzlePrompt(userSelections = {}) {
    // Validate and normalize user selections with enhanced default handling
    const validationResult = this.validateAndNormalizeSelections(
      userSelections.difficulty,
      userSelections.proofTypes
    );
    
    const { difficulty, proofTypes, hasValidSelections } = validationResult;
    
    // Log selection processing for debugging
    console.log('Prompt Builder - Processing selections:', {
      original: userSelections,
      normalized: { difficulty, proofTypes },
      defaultsUsed: {
        difficulty: !hasValidSelections.difficulty,
        proofTypes: !hasValidSelections.proofTypes
      }
    });
    
    // Build the customized prompt with enhanced tag injection
    const prompt = this.buildPrompt(difficulty, proofTypes, userSelections.additionalTags);
    
    return prompt;
  }
}

// Create and export singleton instance
const promptBuilder = new PromptBuilder();
export default promptBuilder;

// Also export the class for testing
export { PromptBuilder };
