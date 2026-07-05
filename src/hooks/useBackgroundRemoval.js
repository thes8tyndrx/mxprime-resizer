import { useState, useCallback } from 'react';
import { removeBackground } from '@imgly/background-removal';

/**
 * Hook to remove or replace image background using client-side WASM.
 * Automatically handles loading/progress states and handles CDN model caching.
 */
export function useBackgroundRemoval() {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removalProgress, setRemovalProgress] = useState(0);
  const [removalError, setRemovalError] = useState(null);

  const removeImageBackground = useCallback(async (imageSource) => {
    setIsRemoving(true);
    setRemovalProgress(0);
    setRemovalError(null);

    const config = {
      progress: (key, current, total) => {
        // key specifies which asset is downloading/processing
        const pct = Math.round((current / total) * 100);
        setRemovalProgress(pct);
      },
      output: {
        format: 'image/png', // Output transparency
        quality: 0.95
      }
    };

    try {
      const outputBlob = await removeBackground(imageSource, config);
      setIsRemoving(false);
      setRemovalProgress(100);
      return outputBlob;
    } catch (err) {
      console.error('Background removal failed:', err);
      setRemovalError(err.message || 'Background removal failed. Please check internet connection or upload a clearer portrait.');
      setIsRemoving(false);
      return null;
    }
  }, []);

  return {
    isRemoving,
    removalProgress,
    removalError,
    removeImageBackground
  };
}
