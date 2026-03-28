import React, { useState } from 'react';
import { Card, Button } from './primitives';
import { Settings, Code, Terminal, Brain, ChevronRight, X } from 'lucide-react';

interface SessionConfigModalProps {
  onStart: (config: { language: string; exerciseId: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const SessionConfigModal: React.FC<SessionConfigModalProps> = ({ onStart, onCancel, isLoading }) => {
  const [language, setLanguage] = useState('typescript');
  const [exerciseId, setExerciseId] = useState('algorithm-two-sum');

  const interviewTypes = [
    { id: 'algorithm-two-sum', name: 'Algorithms', description: 'Data structures and problem solving', icon: Code },
    { id: 'system-design-twitter', name: 'System Design', description: 'Scalability and architecture', icon: Brain },
    { id: 'react-tic-tac-toe', name: 'Frontend', description: 'React and UI components', icon: Terminal },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <Card variant="elevated" className="w-full max-w-lg border border-gray-700 bg-gray-900/90 shadow-2xl relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          disabled={isLoading}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Settings className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Configure Session</h2>
            <p className="text-sm text-gray-400">Tailor your AI interview experience</p>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Interview Type Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wider">Interview Type</label>
            <div className="grid grid-cols-1 gap-3">
              {interviewTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = exerciseId === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => setExerciseId(type.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-300'}`}>{type.name}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                    {isSelected && <ChevronRight className="w-5 h-5 text-blue-500" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wider">Programming Language</label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-xl p-4 border-2 border-gray-800 focus:border-blue-500 focus:outline-none appearance-none transition-all cursor-pointer"
              >
                <option value="typescript">TypeScript (Recommended)</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 font-bold">
                ↓
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <Button variant="secondary" className="flex-1 rounded-xl" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            className="flex-1 rounded-xl shadow-lg shadow-blue-500/20" 
            onClick={() => onStart({ language, exerciseId })} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Initializing...</span>
              </>
            ) : (
              <span>Launch Interview</span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};
