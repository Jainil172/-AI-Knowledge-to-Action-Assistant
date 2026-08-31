import { useState, useCallback, useRef } from 'react';
import { ragApi } from '../services/api';

export function useRagChat(documentId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const askQuestion = useCallback(async (question) => {
    if (!question?.trim() || !documentId) return;

    const trimmedQuestion = question.trim();

    if (isLoading) return;

    setError(null);
    setIsLoading(true);

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: trimmedQuestion,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      abortControllerRef.current = new AbortController();

      const result = await ragApi.ask(documentId, trimmedQuestion);

      if (result.success) {
        const assistantMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: result.answer,
          sources: result.sources || [],
          metadata: result.metadata,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw {
          message: result.error?.message || 'Failed to get answer',
          code: result.error?.code,
        };
      }
    } catch (err) {
      setError(err);

      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: getErrorMessage(err),
        isError: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [documentId, isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    askQuestion,
    clearMessages,
    clearError,
  };
}

function getErrorMessage(err) {
  if (err.code === 'DOCUMENT_NOT_FOUND') {
    return 'This document is no longer available.';
  }

  if (err.code === 'INVALID_QUESTION') {
    return 'Please enter a valid question.';
  }

  if (err.status === 503) {
    return 'The AI service is temporarily unavailable. Please try again.';
  }

  if (err.status === 429) {
    return 'The AI service is currently busy. Please try again shortly.';
  }

  if (err.status >= 500) {
    return 'The AI service is temporarily unavailable. Please try again.';
  }

  return err.message || 'Something went wrong. Please try again.';
}
