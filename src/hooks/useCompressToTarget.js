import { useState, useCallback } from 'react';

/**
 * Hook to compress canvas images to a specific target KB range.
 * Uses binary search on JPEG quality and falls back to smart JPEG comment (COM) marker padding
 * if the image size is lower than the minimum required KB.
 */
export function useCompressToTarget() {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);

  // Pad a JPEG blob with COM (comment) markers to increase size safely without visual distortion
  const padJpegBlob = useCallback(async (blob, minKB) => {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const targetSizeBytes = Math.ceil((minKB + 2) * 1024); // Aim 2 KB above minKB to be safe
    
    if (bytes.length >= targetSizeBytes) {
      return blob;
    }

    const paddingNeeded = targetSizeBytes - bytes.length;

    // Find the EOI (End of Image) marker 0xFFD9
    let eoiIndex = bytes.length - 2;
    while (eoiIndex > 0) {
      if (bytes[eoiIndex] === 0xFF && bytes[eoiIndex + 1] === 0xD9) {
        break;
      }
      eoiIndex--;
    }

    // If EOI marker is not found or is in an invalid place, append to the end as dummy trailing bytes
    if (eoiIndex <= 0) {
      const paddedBytes = new Uint8Array(bytes.length + paddingNeeded);
      paddedBytes.set(bytes);
      return new Blob([paddedBytes], { type: 'image/jpeg' });
    }

    // Create a new pre-allocated array for zero-copy efficiency
    const finalBytes = new Uint8Array(bytes.length + paddingNeeded);
    
    // Copy image content before the EOI marker
    finalBytes.set(bytes.subarray(0, eoiIndex), 0);
    
    // Write COM (0xFFFE) comment segments directly into the target buffer
    let writeIndex = eoiIndex;
    let remainingPadding = paddingNeeded;
    
    while (remainingPadding > 0) {
      const chunkPadding = Math.min(remainingPadding, 65533); // 65535 max length - 2 header bytes
      
      // If remaining padding is too small to build a valid COM header (minimum length 4)
      if (chunkPadding < 4) {
        break;
      }

      finalBytes[writeIndex] = 0xFF;
      finalBytes[writeIndex + 1] = 0xFE;
      finalBytes[writeIndex + 2] = (chunkPadding >> 8) & 0xFF;
      finalBytes[writeIndex + 3] = chunkPadding & 0xFF;
      
      writeIndex += chunkPadding;
      remainingPadding -= chunkPadding;
    }
    
    // Write EOI marker (0xFFD9) at the very end of the padded array
    finalBytes[finalBytes.length - 2] = 0xFF;
    finalBytes[finalBytes.length - 1] = 0xD9;
    
    return new Blob([finalBytes], { type: 'image/jpeg' });
  }, []);

  const compressImage = useCallback(async (canvas, minKB, maxKB) => {
    setIsCompressing(true);
    setCompressProgress(0);

    const targetMaxBytes = maxKB * 1024;
    const targetMinBytes = minKB * 1024;

    let lowQuality = 0.3;  // Floor raised from 0.05 — prevents severely pixelated output
    let highQuality = 1.0;
    let quality = 0.9;
    let bestBlob = null;
    let bestSize = 0;

    const getBlobForQuality = (q) => {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', q);
      });
    };

    // Binary search on quality (maximum 8 iterations)
    for (let i = 0; i < 8; i++) {
      setCompressProgress(Math.round(((i + 1) / 8) * 100));
      quality = (lowQuality + highQuality) / 2;
      
      const blob = await getBlobForQuality(quality);
      if (!blob) break;

      const size = blob.size;

      if (size <= targetMaxBytes) {
        // Fits within max size. Save it and see if we can get better quality (larger size)
        bestBlob = blob;
        bestSize = size;
        lowQuality = quality;
      } else {
        // Too large, must lower quality
        highQuality = quality;
      }

      // If we are already in the target range, we can stop early
      if (size >= targetMinBytes && size <= targetMaxBytes) {
        break;
      }
    }

    // If we didn't find any blob fitting targetMaxBytes, fallback to lowest allowed quality
    if (!bestBlob) {
      bestBlob = await getBlobForQuality(0.3);
      bestSize = bestBlob.size;
    }

    // Check if the best size is still too small (below minKB)
    if (bestBlob && bestSize < targetMinBytes) {
      bestBlob = await padJpegBlob(bestBlob, minKB);
    }

    setIsCompressing(false);
    setCompressProgress(100);

    return {
      blob: bestBlob,
      sizeKB: +(bestBlob.size / 1024).toFixed(2),
      qualityUsed: quality
    };
  }, [padJpegBlob]);

  return {
    isCompressing,
    compressProgress,
    compressImage
  };
}
