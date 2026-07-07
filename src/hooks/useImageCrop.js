import { useState, useCallback } from 'react';

/**
 * Custom hook to handle canvas-based image cropping with drag-resize mechanics,
 * background image zoom, and background panning.
 * Stores crop dimensions as percentages (0-100) of the loaded image container.
 */
export function useImageCrop(aspectRatio = null) {
  const [crop, setCrop] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragType, setDragType] = useState('move'); // 'move', 'tl', 'tr', 'bl', 'br'
  const [initialCrop, setInitialCrop] = useState(null);

  // Background Zoom and Pan states
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 });

  // Initialize crop box fitting the target aspect ratio
  const initCrop = useCallback((imgWidth, imgHeight) => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    
    if (!aspectRatio) {
      setCrop({ x: 10, y: 10, width: 80, height: 80 });
      return;
    }

    const imgAspect = imgWidth / imgHeight;
    let w = 80;
    let h = 80;

    if (aspectRatio > imgAspect) {
      w = 80;
      h = (w / aspectRatio) * imgAspect;
    } else {
      h = 80;
      w = (h * aspectRatio) / imgAspect;
    }

    setCrop({
      x: (100 - w) / 2,
      y: (100 - h) / 2,
      width: w,
      height: h
    });
  }, [aspectRatio]);

  // Start dragging crop box or corner resize handle
  const handleDragStart = useCallback((e, type = 'move', containerRef) => {
    if (!containerRef.current) return;
    e.stopPropagation();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragType(type);
    setDragStart({ x: clientX, y: clientY });
    setInitialCrop({ ...crop });
  }, [crop]);

  // Update crop coordinates based on drag motion
  const handleDragMove = useCallback((e, containerRef) => {
    if (!isDragging || !containerRef.current || !initialCrop) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaX = ((clientX - dragStart.x) / rect.width) * 100;
    const deltaY = ((clientY - dragStart.y) / rect.height) * 100;

    setCrop((prevCrop) => {
      let { x, y, width, height } = { ...prevCrop };

      if (dragType === 'move') {
        x = Math.max(0, Math.min(100 - width, initialCrop.x + deltaX));
        y = Math.max(0, Math.min(100 - height, initialCrop.y + deltaY));
      } else {
        const containerAspect = rect.width / rect.height;
        let newX = prevCrop.x;
        let newY = prevCrop.y;
        let newWidth = prevCrop.width;
        let newHeight = prevCrop.height;

        if (dragType === 'br') {
          newWidth = Math.max(10, Math.min(100 - initialCrop.x, initialCrop.width + deltaX));
          if (aspectRatio) {
            newHeight = (newWidth / aspectRatio) * containerAspect;
          } else {
            newHeight = Math.max(10, Math.min(100 - initialCrop.y, initialCrop.height + deltaY));
          }
          if (initialCrop.y + newHeight > 100) {
            newHeight = 100 - initialCrop.y;
            newWidth = newHeight * aspectRatio / containerAspect;
          }
        } else if (dragType === 'tl') {
          const maxDeltaX = initialCrop.x + initialCrop.width - 10;
          const actualDeltaX = Math.min(maxDeltaX, Math.max(-initialCrop.x, deltaX));
          newX = initialCrop.x + actualDeltaX;
          newWidth = initialCrop.width - actualDeltaX;
          
          if (aspectRatio) {
            const actualDeltaY = (actualDeltaX / aspectRatio) * containerAspect;
            newY = initialCrop.y + actualDeltaY;
            newHeight = initialCrop.height - actualDeltaY;
          } else {
            const maxDeltaY = initialCrop.y + initialCrop.height - 10;
            const actualDeltaY = Math.min(maxDeltaY, Math.max(-initialCrop.y, deltaY));
            newY = initialCrop.y + actualDeltaY;
            newHeight = initialCrop.height - actualDeltaY;
          }

          if (newY < 0) {
            newY = 0;
            newHeight = initialCrop.y + initialCrop.height;
            newWidth = newHeight * aspectRatio / containerAspect;
            newX = initialCrop.x + initialCrop.width - newWidth;
          }
        } else if (dragType === 'tr') {
          newWidth = Math.max(10, Math.min(100 - initialCrop.x, initialCrop.width + deltaX));
          if (aspectRatio) {
            const actualDeltaY = (deltaX / aspectRatio) * containerAspect;
            newY = initialCrop.y - actualDeltaY;
            newHeight = initialCrop.height + actualDeltaY;
          } else {
            const maxDeltaY = initialCrop.y + initialCrop.height - 10;
            const actualDeltaY = Math.min(maxDeltaY, Math.max(-initialCrop.y, deltaY));
            newY = initialCrop.y + actualDeltaY;
            newHeight = initialCrop.height + actualDeltaY;
          }

          if (newY < 0) {
            newY = 0;
            newHeight = initialCrop.y + initialCrop.height;
            newWidth = newHeight * aspectRatio / containerAspect;
          }
        } else if (dragType === 'bl') {
          const maxDeltaX = initialCrop.x + initialCrop.width - 10;
          const actualDeltaX = Math.min(maxDeltaX, Math.max(-initialCrop.x, deltaX));
          newX = initialCrop.x + actualDeltaX;
          newWidth = initialCrop.width - actualDeltaX;

          if (aspectRatio) {
            const actualDeltaY = (actualDeltaX / aspectRatio) * containerAspect;
            newHeight = initialCrop.height + actualDeltaY;
          } else {
            newHeight = Math.max(10, Math.min(100 - initialCrop.y, initialCrop.height + deltaY));
          }

          if (initialCrop.y + newHeight > 100) {
            newHeight = 100 - initialCrop.y;
            newWidth = newHeight * aspectRatio / containerAspect;
            newX = initialCrop.x + initialCrop.width - newWidth;
          }
        }

        x = Math.max(0, Math.min(100 - newWidth, newX));
        y = Math.max(0, Math.min(100 - newHeight, newY));
        width = newWidth;
        height = newHeight;
      }

      return { x, y, width, height };
    });
  }, [isDragging, dragStart, dragType, initialCrop, aspectRatio]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setInitialCrop(null);
  }, []);

  // Start background image panning
  const handlePanStart = useCallback((e, containerRef) => {
    if (!containerRef.current) return;
    e.preventDefault();
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    setIsPanning(true);
    setPanStart({ x: clientX, y: clientY });
    setInitialPan({ ...pan });
  }, [pan]);

  // Update background image pan coordinates
  const handlePanMove = useCallback((e, containerRef) => {
    if (!isPanning || !containerRef.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const deltaX = clientX - panStart.x;
    const deltaY = clientY - panStart.y;
    
    setPan({
      x: initialPan.x + deltaX,
      y: initialPan.y + deltaY
    });
  }, [isPanning, panStart, initialPan]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Crop the source image and write onto canvas of target size, adjusting for zoom, pan, rotate, flip, filters, and bgColor
  const getCroppedImage = useCallback((imgElement, targetWidth, targetHeight, nameDateOverlay = null, options = {}) => {
    return new Promise((resolve) => {
      const {
        rotation = 0,
        flipH = false,
        flipV = false,
        brightness = 100,
        contrast = 100,
        bgColor = '#FFFFFF',
        skipCrop = false,
        levels = null
      } = options;

      const containerWidth = imgElement.clientWidth || imgElement.width;
      const naturalWidth = imgElement.naturalWidth || imgElement.width;
      const naturalHeight = imgElement.naturalHeight || imgElement.height;

      // Calculate display-to-natural scaling factor
      const scaleFactor = naturalWidth / containerWidth;

      // 1. Create a temporary canvas matching the natural/original size of the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = naturalWidth;
      tempCanvas.height = naturalHeight;
      const tempCtx = tempCanvas.getContext('2d');

      // 2. Fill background color
      tempCtx.fillStyle = bgColor;
      tempCtx.fillRect(0, 0, naturalWidth, naturalHeight);

      // 3. Apply filters (brightness, contrast)
      tempCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

      // 4. Render the transformed image onto temp canvas at natural resolution
      tempCtx.save();
      // Translate to center + pan offset (panning is scaled to natural resolution)
      tempCtx.translate(naturalWidth / 2 + pan.x * scaleFactor, naturalHeight / 2 + pan.y * scaleFactor);
      // Scale for zoom (zoom remains dimensionless/relative)
      tempCtx.scale(zoom, zoom);
      // Rotate around transformed center
      tempCtx.rotate((rotation * Math.PI) / 180);
      // Flip if applicable
      const scaleX = flipH ? -1 : 1;
      const scaleY = flipV ? -1 : 1;
      tempCtx.scale(scaleX, scaleY);

      // Draw the image centered at its natural dimensions
      tempCtx.drawImage(
        imgElement,
        -naturalWidth / 2,
        -naturalHeight / 2,
        naturalWidth,
        naturalHeight
      );
      tempCtx.restore();

      // 5. Create final canvas of the exact target dimensions
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetWidth;
      finalCanvas.height = targetHeight;
      const finalCtx = finalCanvas.getContext('2d');

      // Enable high-quality smoothing on the final resize
      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = 'high';

      if (skipCrop) {
        // Fit entire temp canvas onto final canvas (retaining aspect ratio)
        const scale = Math.min(targetWidth / naturalWidth, targetHeight / naturalHeight);
        const dw = naturalWidth * scale;
        const dh = naturalHeight * scale;
        const dx = (targetWidth - dw) / 2;
        const dy = (targetHeight - dh) / 2;

        finalCtx.fillStyle = bgColor;
        finalCtx.fillRect(0, 0, targetWidth, targetHeight);
        finalCtx.drawImage(tempCanvas, dx, dy, dw, dh);
      } else {
        // Extract the cropped region in natural pixels (percentage of natural resolution)
        const cropLeftPx = (crop.x / 100) * naturalWidth;
        const cropTopPx = (crop.y / 100) * naturalHeight;
        const cropWidthPx = (crop.width / 100) * naturalWidth;
        const cropHeightPx = (crop.height / 100) * naturalHeight;

        finalCtx.drawImage(
          tempCanvas,
          cropLeftPx, cropTopPx, cropWidthPx, cropHeightPx,
          0, 0, targetWidth, targetHeight
        );
      }

      // 5b. Apply Document Levels adjustment if configured
      if (levels && (levels.shadows > 0 || levels.highlights < 255 || levels.midtones !== 1.0)) {
        try {
          const { shadows = 0, highlights = 255, midtones = 1.0 } = levels;
          const imageData = finalCtx.getImageData(0, 0, targetWidth, targetHeight);
          const data = imageData.data;
          
          // Precompute lookup table (LUT) for performance
          const lut = new Uint8Array(256);
          const range = highlights - shadows;
          const invGamma = 1.0 / midtones;
          
          for (let i = 0; i < 256; i++) {
            // Normalize and clamp value
            let val = range === 0 ? (i >= shadows ? 1.0 : 0.0) : (i - shadows) / range;
            val = Math.max(0.0, Math.min(1.0, val));
            // Gamma adjustment
            if (midtones !== 1.0) {
              val = Math.pow(val, invGamma);
            }
            lut[i] = Math.round(val * 255);
          }
          
          // Process pixel data (R, G, B channels only)
          for (let i = 0; i < data.length; i += 4) {
            data[i] = lut[data[i]];       // Red
            data[i + 1] = lut[data[i + 1]]; // Green
            data[i + 2] = lut[data[i + 2]]; // Blue
          }
          
          finalCtx.putImageData(imageData, 0, 0);
        } catch (e) {
          console.error("Levels filter processing failed:", e);
        }
      }

      // 6. Name & Date Overlay (drawn without filters or transformations on final canvas)
      if (nameDateOverlay && nameDateOverlay.name) {
        finalCtx.save();
        finalCtx.filter = 'none';
        const overlayHeight = Math.round(targetHeight * 0.22);
        finalCtx.fillStyle = '#FFFFFF';
        finalCtx.fillRect(0, targetHeight - overlayHeight, targetWidth, overlayHeight);

        finalCtx.strokeStyle = '#000000';
        finalCtx.lineWidth = 1.5;
        finalCtx.beginPath();
        finalCtx.moveTo(0, targetHeight - overlayHeight);
        finalCtx.lineTo(targetWidth, targetHeight - overlayHeight);
        finalCtx.stroke();

        finalCtx.fillStyle = '#000000';
        finalCtx.font = `bold ${Math.round(overlayHeight * 0.32)}px sans-serif`;
        finalCtx.textAlign = 'center';
        finalCtx.textBaseline = 'middle';
        finalCtx.fillText(nameDateOverlay.name.toUpperCase(), targetWidth / 2, targetHeight - (overlayHeight * 0.65));

        if (nameDateOverlay.date) {
          finalCtx.font = `${Math.round(overlayHeight * 0.26)}px monospace`;
          finalCtx.fillText(`DOB/DOP: ${nameDateOverlay.date}`, targetWidth / 2, targetHeight - (overlayHeight * 0.28));
        }
        finalCtx.restore();
      }

      // Lossless PNG export to prevent generational JPEG compression quality loss before the final binary size search
      const dataUrl = finalCanvas.toDataURL('image/png');
      resolve(dataUrl);
    });
  }, [crop, zoom, pan]);

  return {
    crop,
    setCrop,
    initCrop,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    // Zoom/Pan
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
    getCroppedImage
  };
}
