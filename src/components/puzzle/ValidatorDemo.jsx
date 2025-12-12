import React, { useState } from 'react';
import ProofValidator, { ValidationUtils } from '../../utils/ProofValidator';
import { PuzzleLoader } from '../../services/puzzleLoader';

const ValidatorDemo = () => {
  // Get the puzzle from the new JSON system
  const testPuzzle = PuzzleLoader.getPuzzleById('proof1'); // This is the n² + n³ = Θ(n³) puzzle
  const [validator] = useState(() => new ProofValidator(testPuzzle));
  const [testOrder, setTestOrder] = useState([]);
  const [result, setResult] = useState(null);

  const testSequences = [
    {
      name: "Empty",
      order: []
    },
    {
      name: "First 3 blocks (correct)",
      order: ['block1-1', 'block1-2', 'block1-3']
    },
    {
      name: "Wrong order",
      order: ['block1-2', 'block1-1', 'block1-3']
    },
    {
      name: "Complete correct solution",
      order: testPuzzle.solutionOrder
    },
    {
      name: "Missing middle blocks",
      order: ['block1-1', 'block1-5', 'block1-11']
    }
  ];

  const runTest = (order) => {
    setTestOrder(order);
    const validation = validator.validateProof(order);
    setResult(validation);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', color: '#fff' }}>
      <h2>Proof Validator Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Sequences:</h3>
        {testSequences.map((test, index) => (
          <button
            key={index}
            onClick={() => runTest(test.order)}
            style={{
              display: 'block',
              margin: '5px 0',
              padding: '10px',
              background: '#444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {test.name}
          </button>
        ))}
      </div>

      {result && (
        <div style={{ 
          background: '#2c2c2c', 
          padding: '20px', 
          borderRadius: '8px',
          border: `2px solid ${result.isCorrect ? '#4CAF50' : '#f44336'}`
        }}>
          <h3>Validation Result:</h3>
          <p><strong>Score:</strong> {result.score}%</p>
          <p><strong>Correct:</strong> {result.isCorrect ? 'Yes' : 'No'}</p>
          <p><strong>Feedback:</strong> {result.feedback}</p>
          
          {result.details && (
            <div>
              <h4>Details:</h4>
              <ul>
                <li>Total blocks: {result.details.totalBlocks}</li>
                <li>User blocks: {result.details.userBlocks}</li>
                <li>Correct blocks: {result.details.correctBlocks}</li>
                <li>Missing blocks: {result.details.missingBlocks}</li>
                <li>Extra blocks: {result.details.extraBlocks}</li>
              </ul>
            </div>
          )}

          {result.hints && result.hints.length > 0 && (
            <div>
              <h4>Hints:</h4>
              <ul>
                {result.hints.map((hint, index) => (
                  <li key={index}>{hint.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidatorDemo;