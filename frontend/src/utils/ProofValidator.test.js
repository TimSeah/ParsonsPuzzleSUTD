import { describe, expect, it } from 'vitest';
import ProofValidator from './ProofValidator.js';

const puzzle = {
  id: 'symbols',
  title: 'T',
  blocks: [
    { id: 'a', latex: 'n {{op:\\geq}} 1' },
    { id: 'b', latex: '\\text{Step } B' },
  ],
  solutionOrder: ['a', 'b'],
};

describe('ProofValidator with symbol placeholders', () => {
  const validator = new ProofValidator(puzzle);

  it('does not accept the right order with an unchosen or wrong symbol', () => {
    for (const selections of [{}, { a: { op_0: '<' } }]) {
      const result = validator.validateProof(['a', 'b'], selections);
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBeLessThan(100);
      expect(result.details.symbolErrors).toEqual([{ blockId: 'a', position: 0 }]);
      expect(result.feedback).toContain('1 step(s) have a symbol to fix');
      expect(result.hints[0]).toMatchObject({ type: 'symbol', message: expect.stringContaining('step 1'), latex: '' });
    }
  });

  it('accepts the right order with the right symbols', () => {
    const result = validator.validateProof(['a', 'b'], { a: { op_0: '\\geq' } });
    expect(result).toMatchObject({ isCorrect: true, score: 100 });
    expect(result.details.symbolErrors).toEqual([]);
  });

  it('still scores order when no selections are passed for steps without placeholders', () => {
    const plain = new ProofValidator({ ...puzzle, blocks: [{ id: 'a', latex: 'A' }, { id: 'b', latex: 'B' }] });
    expect(plain.validateProof(['a', 'b'])).toMatchObject({ isCorrect: true, score: 100 });
  });
});
