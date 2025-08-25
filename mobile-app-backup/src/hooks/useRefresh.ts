import { useState, useCallback } from 'react';

export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async (refreshFunction: () => Promise<void>) => {
    setRefreshing(true);
    try {
      await refreshFunction();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  return {
    refreshing,
    onRefresh,
  };
}