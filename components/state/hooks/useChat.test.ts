// File: components/state/hooks/useChat.test.ts

import { parseIncomingMessage } from './useChat';

describe('useChat - parseIncomingMessage', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Suppress console.error messages for cleaner test output
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  test('should parse a valid JSON string successfully', () => {
    const jsonString = '{"persona": "Gemma", "message": "Let\'s start with your project!"}';
    const result = parseIncomingMessage(jsonString);
    expect(result).toEqual({ persona: 'Gemma', message: "Let's start with your project!" });
  });

  test('should handle a JSON string with escaped characters correctly', () => {
    const jsonString = '{"persona": "Gemma", "message": "Okay! Let\'s start with your *project*."}';
    const result = parseIncomingMessage(jsonString);
    expect(result).toEqual({ persona: 'Gemma', message: "Okay! Let's start with your *project*." });
  });

  test('should return null for an invalid JSON string', () => {
    const invalidJsonString = '{"persona": "Gemma", "message": "Okay! Let\'s start with your *project*';
    const result = parseIncomingMessage(invalidJsonString);
    expect(result).toBeNull();
  });

  test('should handle newlines in message content gracefully', () => {
    const jsonString = '{"persona": "Gemma", "message": "Let\'s start\\n with your project!"}';
    const result = parseIncomingMessage(jsonString);
    expect(result).toEqual({ persona: 'Gemma', message: "Let's start\n with your project!" });
  });
});
