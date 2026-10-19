# OpenAI Integration Services

This directory contains the OpenAI API integration services for LLM-powered puzzle generation.

## Services

### 1. Secure OpenAI service (`server/services/openaiPuzzleService.js`)
- **Purpose**: Server-side Responses API client used by `/api/generate`
- **Features**:
  - Server-only API key handling (`OPENAI_API_KEY`)
  - Background-mode generation with polling for long-running requests
  - Separate browser and OpenAI timeouts
  - Comprehensive error handling for different HTTP status codes (401, 429, 500)
  - GPT-6 Astra (`gpt-6-astra`)
  - Structured JSON output and Lean verification before persistence

### 2. Prompt Builder (`promptBuilder.js`)
- **Purpose**: Constructs structured prompts for puzzle generation
- **Features**:
  - Base prompt template with format specification and rules
  - Difficulty level customization (easy, medium, hard)
  - Proof type emphasis (big-o, induction, set-theory, etc.)
  - Input validation and normalization
  - Label mapping from display names to internal identifiers

### 3. Puzzle Generator (`puzzleGenerator.js`)
- **Purpose**: Orchestrates puzzle generation using OpenAI API and prompt building
- **Features**:
  - Complete puzzle generation workflow
  - Response parsing and validation
  - Difficulty-specific block-count and structure validation
  - Metadata addition (ID, timestamps, source tracking)
  - Comprehensive error handling and validation

## Environment Configuration

Create `server/.env` with:
```
OPENAI_API_KEY=your_api_key_here
OPENAI_ASSISTANT_NAME=Astra
OPENAI_MODEL=gpt-6-astra
OPENAI_SERVICE_TIER=auto
OPENAI_BACKGROUND=true
OPENAI_TIMEOUT_MS=300000
OPENAI_POLL_INTERVAL_MS=2000
```

Never put an OpenAI key in a `VITE_` variable. Vite variables are exposed to the browser.

The frontend uses a 30-second timeout for ordinary API calls and a separate
`VITE_GENERATION_TIMEOUT_MS` value (20 minutes by default) for generation. An uncached
request can require one or more Astra generations followed by Lean compilation, so it
must not use the ordinary API timeout.

Every newly generated, Lean-verified puzzle stores these counters under its MongoDB
`generation` object:

- `improperlyFormattedAttemptCount`: Astra outputs that were empty, invalid JSON, or
  rejected by the Parsons puzzle application contract before the successful output.
- `leanRejectedAttemptCount`: structurally valid attempts that Lean rejected before
  the successful proof. Lean worker timeouts and infrastructure errors are not counted
  as proof rejections.
- `repairAttemptCount`: total unsuccessful attempts before success, retained for
  compatibility.

## Usage Example

```javascript
import puzzleGenerator from './services/puzzleGenerator.js';

const userSelections = {
  difficulty: 'medium',
  proofTypes: ['induction', 'big-o'],
  additionalTags: ['mathematical']
};

try {
  const puzzle = await puzzleGenerator.generatePuzzle(userSelections);
  console.log('Generated puzzle:', puzzle);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

## Error Handling

All services implement comprehensive error handling:
- **Configuration errors**: Missing API key
- **Network errors**: Connection failures, timeouts
- **API errors**: Authentication failures, rate limits, server errors
- **Validation errors**: Invalid puzzle structure, missing required fields

## Testing

Run the integration test:
```bash
node src/test/openaiIntegrationTest.js
```

This tests all services without requiring an actual API key, verifying error handling and structure validation.
