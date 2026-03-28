import React, { useState } from 'react';
import { Card, Button } from './primitives';

interface SessionConfigModalProps {
  onStart: (config: { language: string; exerciseId: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SessionConfigModal: React.FC<SessionConfigModalProps> = ({ onStart, onCancel, isLoading }) => {
  const [language, setLanguage] = useState('typescript');
  const [exerciseId, setExerciseId] = useState('algorithm-two-sum');

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card variant="elevated" className="w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Configure Session</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Interview Type</label>
            <select
              value={exerciseId}
              onChange={(e) => setExerciseId(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="algorithm-two-sum">Algorithms (Two Sum)</option>
              <option value="system-design-twitter">System Design (Twitter)</option>
              <option value="react-tic-tac-toe">Frontend (React Component)</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">Programming Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-3 border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="typescript">TypeScript</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => onStart({ language, exerciseId })} disabled={isLoading}>
            {isLoading ? 'Starting...' : 'Start Session'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
