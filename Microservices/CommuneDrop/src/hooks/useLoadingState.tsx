"use client";

import { useState, useCallback } from "react";

interface LoadingState {
  [key: string]: boolean;
}

/**
 * Hook for managing multiple loading states
 */
export function useLoadingState(initialStates: string[] = []) {
  const initialLoadingState: LoadingState = {};
  initialStates.forEach((state) => {
    initialLoadingState[state] = false;
  });

  const [loadingStates, setLoadingStates] =
    useState<LoadingState>(initialLoadingState);

  /**
   * Start loading for a specific key
   */
  const startLoading = useCallback((key: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: true,
    }));
  }, []);

  /**
   * Stop loading for a specific key
   */
  const stopLoading = useCallback((key: string) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: false,
    }));
  }, []);

  /**
   * Check if any loading state is active
   */
  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some((state) => state);
  }, [loadingStates]);

  /**
   * Run a function with loading state management
   */
  const withLoading = useCallback(
    async (key: string, fn: () => Promise<any>) => {
      try {
        startLoading(key);
        return await fn();
      } finally {
        stopLoading(key);
      }
    },
    [startLoading, stopLoading]
  );

  return {
    loadingStates,
    isLoading: useCallback(
      (key: string) => loadingStates[key] || false,
      [loadingStates]
    ),
    startLoading,
    stopLoading,
    isAnyLoading,
    withLoading,
  };
}
