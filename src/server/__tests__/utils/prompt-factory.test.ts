import { PromptFactory } from '../../utils/prompt-factory';

describe('PromptFactory', () => {
  it('should generate an algorithm prompt with the correct language', () => {
    const prompt = PromptFactory.generate({ exerciseId: 'two-sum', language: 'python' });
    expect(prompt).toContain('You are an expert technical interviewer');
    expect(prompt).toContain('The candidate is writing in python.');
    expect(prompt).toContain('two-sum');
  });

  it('should generate a system design prompt', () => {
    const prompt = PromptFactory.generate({ exerciseId: 'system-design-twitter', language: 'any' });
    expect(prompt).toContain('You are an expert software architect');
    expect(prompt).toContain('system-design');
  });
});
