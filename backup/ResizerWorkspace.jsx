import { useState, useRef, useEffect } from 'react';
import { useImageCrop } from '../hooks/useImageCrop';
import { useCompressToTarget } from '../hooks/useCompressToTarget';
import { useBackgroundRemoval } from '../hooks/useBackgroundRemoval';

export function ResizerWorkspace({ activeExam, onAddToBatch, addToast }) {
  const [activeDoc, setActiveDoc] = useState('photo'); // 'photo', 'signature', 'thumb', 'declaration', 'custom'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  
  // Custom Workspace parameters
  const [unit, setUnit] = useState('px'); // 'px', 'cm', 'mm', 'inch'
  
  // Custom Dimension states (for the Custom Resize card)
  const [customWidth, setCustomWidth] = useState(300);
  const [customHeight, setCustomHeight] = useState(300);
  const [customMinKB, setCustomMinKB] = useState(10);
  const [customMaxKB, setCustomMaxKB] = useState(50);
  const [customDPI, setCustomDPI] = useState(200); // 200 or 300 DPI
  
  // Name & Date Overlay states (for photos)
  const [nameOverlay, setNameOverlay] = useState('');
  const [dateOverlay, setDateOverlay] = useState('');
  
  // Premium Editor states
  const [rotation, setRotation] = useState(0); // 0, 90, 180, 270 deg
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100); // 50 to 150
  const [contrast, setContrast] = useState(100); // 50 to 150
  const [bgColor, setBgColor] = useState('#FFFFFF'); // '#FFFFFF', '#DCEEFF', '#E5E5E5'
  const [skipCrop, setSkipCrop] = useState(false); // skip cropping and resize full image
  
  // Processed output state
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Automatically update active doc type when switching to custom or banking exams
  useEffect(() => {
    if (activeExam.id === 'custom') {
      setActiveDoc('custom');
      setUnit('px');
    } else {
      setActiveDoc('photo');
      setUnit('px');
    }
    // Reset editor parameters
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setBgColor('#FFFFFF');
    setSkipCrop(false);
  }, [activeExam]);

  // Compute custom specs based on DPI and unit
  let calculatedWidth = customWidth;
  let calculatedHeight = customHeight;

  if (activeExam.id === 'custom') {
    if (unit === 'inch') {
      calculatedWidth = Math.round(customWidth * customDPI);
      calculatedHeight = Math.round(customHeight * customDPI);
    } else if (unit === 'cm') {
      calculatedWidth = Math.round((customWidth / 2.54) * customDPI);
      calculatedHeight = Math.round((customHeight / 2.54) * customDPI);
    } else if (unit === 'mm') {
      calculatedWidth = Math.round((customWidth / 25.4) * customDPI);
      calculatedHeight = Math.round((customHeight / 25.4) * customDPI);
    }
  }

  const spec = activeExam.id === 'custom' ? {
    width: Math.max(20, calculatedWidth),
    height: Math.max(20, calculatedHeight),
    minKB: customMinKB,
    maxKB: customMaxKB,
    aspectRatio: calculatedWidth / calculatedHeight,
    format: 'image/jpeg'
  } : activeExam.docs[activeDoc];

  // Initialize crop hook
  const {
    crop,
    initCrop,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    // Zoom / Pan
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
    getCroppedImage
  } = useImageCrop(spec ? spec.aspectRatio : 1.0);

  const { isCompressing, compressProgress, compressImage } = useCompressToTarget();
  const { isRemoving, removalProgress, removalError, removeImageBackground } = useBackgroundRemoval();

  // Reset file and state when changing document type or exam
  useEffect(() => {
    setUploadedFile(null);
    setImageSrc(null);
    setProcessedResult(null);
    setNameOverlay('');
    setDateOverlay('');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setBrightness(100);
    setContrast(100);
    setBgColor('#FFFFFF');
    setSkipCrop(false);
  }, [activeDoc, activeExam]);

  // Re-initialize crop coordinates whenever aspect ratio changes
  useEffect(() => {
    if (imageSrc && imgRef.current && spec) {
      const img = imgRef.current;
      if (img.complete) {
        initCrop(img.naturalWidth, img.naturalHeight);
      }
    }
  }, [spec?.aspectRatio, imageSrc, initCrop]);

  // Attach mouse wheel zoom listener to the cropper wrapper
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageSrc || skipCrop) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const zoomStep = 0.04;
      let newZoom = zoom;
      if (e.deltaY < 0) {
        newZoom = Math.min(3.0, zoom + zoomStep);
      } else {
        newZoom = Math.max(1.0, zoom - zoomStep);
      }
      setZoom(newZoom);
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom, setZoom, imageSrc, skipCrop]);

  // Handle image file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      addToast('Invalid file type. Please upload an image.', 'error');
      return;
    }
    setUploadedFile(file);
    setProcessedResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target.result;
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        initCrop(img.naturalWidth, img.naturalHeight);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Drag wrappers (direct dual routing: crop drag vs pan image)
  const handleWrapperMouseDown = (e) => {
    if (skipCrop) return;
    if (e.target.closest('.crop-box')) return;
    handlePanStart(e, containerRef);
  };

  const handleWrapperTouchStart = (e) => {
    if (skipCrop) return;
    if (e.target.closest('.crop-box')) return;
    handlePanStart(e, containerRef);
  };

  const handleWrapperMouseMove = (e) => {
    if (skipCrop) return;
    if (isDragging) {
      handleDragMove(e, containerRef);
    } else if (isPanning) {
      handlePanMove(e, containerRef);
    }
  };

  const handleWrapperTouchMove = (e) => {
    if (skipCrop) return;
    if (isDragging) {
      handleDragMove(e, containerRef);
    } else if (isPanning) {
      handlePanMove(e, containerRef);
    }
  };

  const handleWrapperMouseUp = () => {
    if (skipCrop) return;
    handleDragEnd();
    handlePanEnd();
  };

  // Run background removal
  const handleRemoveBackground = async () => {
    if (!imageSrc) return;
    addToast('Downloading AI models (cached thereafter)... This may take a minute.', 'info');
    const resultBlob = await removeImageBackground(imageSrc);
    if (resultBlob) {
      const resultUrl = URL.createObjectURL(resultBlob);
      setImageSrc(resultUrl);
      addToast('Background removed successfully.', 'success');
      const img = new Image();
      img.onload = () => {
        initCrop(img.naturalWidth, img.naturalHeight);
      };
      img.src = resultUrl;
      setProcessedResult(null);
    } else {
      addToast(removalError || 'Background removal failed.', 'error');
    }
  };

  // Process Crop and Compress to target size
  const handleResizeAndCompress = async () => {
    if (!imageSrc || !imgRef.current || !spec) return;
    setIsProcessing(true);

    try {
      const overlayData = activeDoc === 'photo' && nameOverlay
        ? { name: nameOverlay, date: dateOverlay }
        : null;

      // Extract details including zoom, pan, rotate, flip, and brightness/contrast parameters
      const croppedDataUrl = await getCroppedImage(imgRef.current, spec.width, spec.height, overlayData, {
        rotation,
        flipH,
        flipV,
        brightness,
        contrast,
        bgColor,
        skipCrop
      });

      const canvas = document.createElement('canvas');
      canvas.width = spec.width;
      canvas.height = spec.height;
      const ctx = canvas.getContext('2d');

      const tempImg = new Image();
      tempImg.onload = async () => {
        ctx.drawImage(tempImg, 0, 0);

        const compressResult = await compressImage(canvas, spec.minKB, spec.maxKB);
        const previewUrl = URL.createObjectURL(compressResult.blob);

        setProcessedResult({
          blob: compressResult.blob,
          sizeKB: compressResult.sizeKB,
          width: spec.width,
          height: spec.height,
          dataUrl: previewUrl
        });

        setIsProcessing(false);
        addToast('Document resized and compressed successfully!', 'success');
      };
      tempImg.src = croppedDataUrl;

    } catch (err) {
      console.error(err);
      addToast('Error processing image.', 'error');
      setIsProcessing(false);
    }
  };

  // Add the current processed document to the batch
  const handleAddToBatchClick = () => {
    if (!processedResult) return;
    
    const filename = `${activeExam.id}-${activeDoc}.jpg`;
    onAddToBatch({
      id: `${activeExam.id}-${activeDoc}`,
      examName: activeExam.name,
      docType: activeDoc,
      filename,
      sizeKB: processedResult.sizeKB,
      width: processedResult.width,
      height: processedResult.height,
      blob: processedResult.blob,
      dataUrl: processedResult.dataUrl
    });
    
    addToast(`${activeDoc.toUpperCase()} added to download dashboard.`, 'success');
  };

  // Format document titles
  const getDocTitle = (type) => {
    switch (type) {
      case 'photo': return 'Photograph';
      case 'signature': return 'Signature';
      case 'thumb': return 'Left Thumb Impression';
      case 'declaration': return 'Handwritten Declaration';
      case 'custom': return 'Custom Document';
      default: return 'Document';
    }
  };

  // Get helpful hint text per document type
  const getDocHint = (type) => {
    switch (type) {
      case 'photo': return 'Recent passport size photo. White background preferred. Look straight at the camera.';
      case 'signature': return 'Sign clearly using a black ink pen on white paper. Do NOT sign in capital letters.';
      case 'thumb': return 'Apply your left thumb clearly on white paper using blue or black ink. Ensure it is not smudged.';
      case 'declaration': return 'Write the declaration text below in your own handwriting with black ink on white paper.';
      case 'custom': return 'Resize any photo, signature, or document to your exact custom specifications.';
      default: return '';
    }
  };

  // Unit conversion mapper
  const getFormattedDimensions = (docType, unitType, customSpec = null) => {
    const currentSpec = customSpec || (activeExam.id === 'custom' ? {
      width: spec.width,
      height: spec.height
    } : activeExam.docs[docType]);

    if (!currentSpec) return '';

    if (unitType === 'cm') {
      if (activeExam.id !== 'custom') {
        if (docType === 'photo') return '3.5 x 4.5 cm';
        if (docType === 'signature') return '3.5 x 1.5 cm';
        if (docType === 'thumb') return '3.0 x 3.0 cm';
        if (docType === 'declaration') return '10.0 x 5.0 cm';
      }
      const cmW = (currentSpec.width / (customDPI / 2.54)).toFixed(1);
      const cmH = (currentSpec.height / (customDPI / 2.54)).toFixed(1);
      return `${cmW} x ${cmH} cm`;
    }
    if (unitType === 'mm') {
      if (activeExam.id !== 'custom') {
        if (docType === 'photo') return '35 x 45 mm';
        if (docType === 'signature') return '35 x 15 mm';
        if (docType === 'thumb') return '30 x 30 mm';
        if (docType === 'declaration') return '100 x 50 mm';
      }
      const mmW = Math.round(currentSpec.width / (customDPI / 25.4));
      const mmH = Math.round(currentSpec.height / (customDPI / 25.4));
      return `${mmW} x ${mmH} mm`;
    }
    if (unitType === 'inch') {
      const inW = (currentSpec.width / customDPI).toFixed(2);
      const inH = (currentSpec.height / customDPI).toFixed(2);
      return `${inW} x ${inH} inch`;
    }
    // Default 'px'
    return `${currentSpec.width} x ${currentSpec.height} px`;
  };

  return (
    <div className="workspace-wrapper">
      {/* Document Type subtabs (Hidden if Custom configuration active) */}
      {activeExam.id !== 'custom' && (
        <div className="doc-tabs-container">
          {['photo', 'signature', 'thumb', 'declaration'].map((type) => (
            <button
              key={type}
              className={`doc-tab-btn ${activeDoc === type ? 'active' : ''}`}
              onClick={() => setActiveDoc(type)}
            >
              {getDocTitle(type)}
            </button>
          ))}
        </div>
      )}

      <div className="workspace-grid">
        
        {/* Left Column: Image uploading and cropping wrapper */}
        <div className="workspace-main">
          {!imageSrc ? (
            <div
              className="upload-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <span className="upload-icon">✦</span>
              <h3 className="upload-title">Drag & drop your {getDocTitle(activeDoc)} here</h3>
              <p className="upload-sub">or click to browse from your device</p>
              {spec && (
                <span className="upload-sub" style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                  Fits target: {getFormattedDimensions(activeDoc, unit)} · {spec.minKB}-{spec.maxKB} KB
                </span>
              )}
              
              <input
                id="fileInput"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/jpeg, image/jpg, image/png, image/webp"
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Instructions and wheel zoom notification */}
              {!skipCrop && (
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span>💡 <b>Tip:</b> Click + Drag <b>inside</b> crop frame to move box. Click + Drag <b>outside</b> to pan/move image.</span>
                  <span>🖱️ Use <b>Mouse Scroll Wheel</b> to zoom.</span>
                </div>
              )}

              {/* Canvas Top Controls Toolbar */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#292524',
                padding: '8px',
                width: '100%',
                flexWrap: 'wrap',
                borderTopLeftRadius: '2px',
                borderTopRightRadius: '2px'
              }}>
                {/* Zoom Controls */}
                {!skipCrop && (
                  <>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setZoom(z => Math.max(1.0, z - 0.1))} title="Zoom Out">➖ Zoom</button>
                    <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} title="Zoom In">➕ Zoom</button>
                    <span style={{ color: '#57534E', margin: '0 2px' }}>|</span>
                  </>
                )}

                {/* Rotation Controls */}
                <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setRotation(r => (r - 90 + 360) % 360)} title="Rotate Left">🔄 Rotate L</button>
                <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setRotation(r => (r + 90) % 360)} title="Rotate Right">🔄 Rotate R</button>
                
                <span style={{ color: '#57534E', margin: '0 2px' }}>|</span>

                {/* Flip Controls */}
                <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setFlipH(f => !f)} title="Flip Horizontally">↔️ Flip H</button>
                <button type="button" className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => setFlipV(f => !f)} title="Flip Vertically">↕️ Flip V</button>

                <span style={{ color: '#57534E', margin: '0 2px' }}>|</span>

                {/* Reset Everything */}
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: '#FCA5A5', color: '#7F1D1D', fontWeight: 'bold' }}
                  onClick={() => {
                    setZoom(1.0);
                    setPan({ x: 0, y: 0 });
                    setRotation(0);
                    setFlipH(false);
                    setFlipV(false);
                    setBrightness(100);
                    setContrast(100);
                    setBgColor('#FFFFFF');
                  }}
                >
                  Reset Editor
                </button>
              </div>

              {/* Centered Cropper Canvas */}
              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#1C1917', padding: '10px' }}>
                <div
                  className="cropper-wrapper"
                  ref={containerRef}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    overflow: 'hidden',
                    maxWidth: '100%',
                    maxHeight: '480px',
                    backgroundColor: bgColor
                  }}
                  onMouseDown={handleWrapperMouseDown}
                  onTouchStart={handleWrapperTouchStart}
                  onMouseMove={handleWrapperMouseMove}
                  onTouchMove={handleWrapperTouchMove}
                  onMouseUp={handleWrapperMouseUp}
                  onTouchEnd={handleWrapperMouseUp}
                  onMouseLeave={handleWrapperMouseUp}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    className="cropper-image"
                    alt="Source"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                      filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                      transformOrigin: 'center center',
                      transition: isPanning ? 'none' : 'transform 0.15s ease, filter 0.15s ease'
                    }}
                    onLoad={(e) => initCrop(e.target.naturalWidth, e.target.naturalHeight)}
                  />
                  
                  {/* Interactive Crop Frame (Hidden if Skip Crop checked) */}
                  {!skipCrop && (
                    <div
                      className="crop-box"
                      style={{
                        left: `${crop.x}%`,
                        top: `${crop.y}%`,
                        width: `${crop.width}%`,
                        height: `${crop.height}%`
                      }}
                      onMouseDown={(e) => handleDragStart(e, 'move', containerRef)}
                      onTouchStart={(e) => handleDragStart(e, 'move', containerRef)}
                    >
                      <div className="crop-handle crop-handle-tl" onMouseDown={(e) => handleDragStart(e, 'tl', containerRef)} onTouchStart={(e) => handleDragStart(e, 'tl', containerRef)}></div>
                      <div className="crop-handle crop-handle-tr" onMouseDown={(e) => handleDragStart(e, 'tr', containerRef)} onTouchStart={(e) => handleDragStart(e, 'tr', containerRef)}></div>
                      <div className="crop-handle crop-handle-bl" onMouseDown={(e) => handleDragStart(e, 'bl', containerRef)} onTouchStart={(e) => handleDragStart(e, 'bl', containerRef)}></div>
                      <div className="crop-handle crop-handle-br" onMouseDown={(e) => handleDragStart(e, 'br', containerRef)} onTouchStart={(e) => handleDragStart(e, 'br', containerRef)}></div>
                    </div>
                  )}

                  {/* Processing/AI Model loading spinner overlay */}
                  {(isProcessing || isCompressing || isRemoving) && (
                    <div className="loader-overlay">
                      <div className="spinner"></div>
                      <span className="loader-text">
                        {isRemoving 
                          ? `REMOVING BACKGROUND (${removalProgress}%)`
                          : isCompressing 
                            ? `COMPRESSING QUALITY (${compressProgress}%)`
                            : 'PROCESSING...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Zoom Slider (Hidden if Skip Crop checked) */}
              {!skipCrop && (
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Zoom Image:</label>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.02"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ flexGrow: 1, accentColor: 'var(--accent)' }}
                  />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 'bold', width: '45px' }}>
                    {zoom.toFixed(2)}x
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '4px 8px', fontSize: '10px' }}
                    onClick={() => { setZoom(1.0); setPan({ x: 0, y: 0 }); }}
                  >
                    Reset Zoom
                  </button>
                </div>
              )}

              {/* Cropper action buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn-primary"
                  onClick={handleResizeAndCompress}
                  disabled={isProcessing || isCompressing || isRemoving}
                >
                  Resize & Compress
                </button>
                
                {activeDoc === 'photo' && (
                  <button
                    className="btn-secondary"
                    onClick={handleRemoveBackground}
                    disabled={isProcessing || isCompressing || isRemoving}
                  >
                    AI Remove Background
                  </button>
                )}

                <button
                  className="btn-secondary"
                  onClick={() => {
                    setImageSrc(null);
                    setUploadedFile(null);
                    setProcessedResult(null);
                  }}
                  style={{ marginLeft: 'auto' }}
                >
                  Clear File
                </button>
              </div>
            </div>
          )}

          {/* Legal alert warning near the upload box */}
          <div className="legal-card-container">
            <div className="legal-card">
              ⚠️ <b>Compliance Warning:</b> Government upload portals validate the file size and resolution down to the exact pixel. Always verify that your final downloads match the official criteria before final form submission.
            </div>
          </div>
        </div>

        {/* Right Column: Settings and Validation results */}
        <div className="workspace-sidebar">
          
          {/* Custom spec inputs (Rendered only when Custom Resize preset is selected) */}
          {activeExam.id === 'custom' && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Configure Dimensions</h4>
              
              {/* Unit Selector */}
              <div className="form-group">
                <label className="form-label">Dimensions Unit</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['px', 'cm', 'mm', 'inch'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`exam-tab-btn ${unit === u ? 'active' : ''}`}
                      style={{ padding: '6px 8px', fontSize: '11px', flexGrow: 1 }}
                      onClick={() => setUnit(u)}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* DPI selection */}
              {unit !== 'px' && (
                <div className="form-group">
                  <label className="form-label">Target DPI</label>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[200, 300].map((d) => (
                      <button
                        key={d}
                        type="button"
                        className={`exam-tab-btn ${customDPI === d ? 'active' : ''}`}
                        style={{ padding: '6px 8px', fontSize: '11px', flexGrow: 1 }}
                        onClick={() => setCustomDPI(d)}
                      >
                        {d} DPI
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Size Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Width ({unit.toUpperCase()})</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="form-input"
                    value={customWidth}
                    onChange={(e) => {
                      const val = Math.max(0.1, parseFloat(e.target.value) || 0);
                      setCustomWidth(val);
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Height ({unit.toUpperCase()})</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    className="form-input"
                    value={customHeight}
                    onChange={(e) => {
                      const val = Math.max(0.1, parseFloat(e.target.value) || 0);
                      setCustomHeight(val);
                    }}
                  />
                </div>
              </div>

              {/* Custom File Size limits */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Min Size (KB)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={customMinKB}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 10);
                      setCustomMinKB(val);
                    }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Size (KB)</label>
                  <input
                    type="number"
                    min="5"
                    className="form-input"
                    value={customMaxKB}
                    onChange={(e) => {
                      const val = Math.max(5, parseInt(e.target.value) || 50);
                      setCustomMaxKB(val);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Premium Image Adjustments Block */}
          {imageSrc && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Image Adjustments</h4>
              
              {/* Skip Cropping toggle */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  id="skipCropCheck"
                  checked={skipCrop}
                  onChange={(e) => setSkipCrop(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
                />
                <label htmlFor="skipCropCheck" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
                  Resize Only (Disable Crop frame)
                </label>
              </div>

              {/* Brightness slider */}
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Brightness</label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              {/* Contrast slider */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Contrast</label>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent)' }}
                />
              </div>

              {/* Background Color Fill Selection */}
              <div className="form-group">
                <label className="form-label">Background Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { name: 'White', hex: '#FFFFFF' },
                    { name: 'Light Blue', hex: '#DCEEFF' },
                    { name: 'Grey', hex: '#E5E5E5' }
                  ].map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      className={`exam-tab-btn ${bgColor === color.hex ? 'active' : ''}`}
                      style={{
                        padding: '6px 8px',
                        fontSize: '11px',
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                      onClick={() => setBgColor(color.hex)}
                    >
                      <span style={{
                        width: '10px',
                        height: '10px',
                        backgroundColor: color.hex,
                        borderRadius: '50%',
                        border: '1px solid #44403C'
                      }}></span>
                      {color.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Target Spec Details block */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">Target Specifications</h4>
            
            {/* Unit Selector (Hidden for custom config since custom gets its own picker) */}
            {activeExam.id !== 'custom' && (
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Display Unit</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {['px', 'cm', 'mm'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      className={`exam-tab-btn ${unit === u ? 'active' : ''}`}
                      style={{ padding: '6px 12px', fontSize: '11px', flexGrow: 1 }}
                      onClick={() => setUnit(u)}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="spec-list">
              <div className="spec-item">
                <span className="spec-label">Exam Profile</span>
                <span className="spec-val" style={{ color: 'var(--accent)' }}>{activeExam.name}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Document Type</span>
                <span className="spec-val">{getDocTitle(activeDoc)}</span>
              </div>
              <div className="spec-item">
                <span className="spec-label">Required Size</span>
                <span className="spec-val">{getFormattedDimensions(activeDoc, unit)}</span>
              </div>
              {spec && (
                <>
                  <div className="spec-item">
                    <span className="spec-label">Allowed File Weight</span>
                    <span className="spec-val">{spec.minKB} KB - {spec.maxKB} KB</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Required Format</span>
                    <span className="spec-val">JPG / JPEG</span>
                  </div>
                </>
              )}
            </div>
            
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px', fontStyle: 'italic', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              ℹ️ {getDocHint(activeDoc)}
            </p>
          </div>

          {/* Photograph specific overlay parameters */}
          {activeDoc === 'photo' && imageSrc && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Photo Name Overlay (Optional)</h4>
              <div className="form-group">
                <label className="form-label">Applicant Name</label>
                <input
                  type="text"
                  placeholder="E.g., RAJESH KUMAR"
                  className="form-input"
                  value={nameOverlay}
                  onChange={(e) => setNameOverlay(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Date of Photo / DOB</label>
                <input
                  type="text"
                  placeholder="E.g., 05/07/2026"
                  className="form-input"
                  value={dateOverlay}
                  onChange={(e) => setDateOverlay(e.target.value)}
                />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                * Overlays a clean white bar containing your name and dates at the bottom of the passport image. Fits requirements for SSC/Railway exams.
              </p>
            </div>
          )}

          {/* Handwritten Declaration text template */}
          {activeDoc === 'declaration' && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Copy Declaration Text</h4>
              <div
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  backgroundColor: '#FFFFFF',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  lineHeight: '1.6',
                  fontStyle: 'italic',
                  userSelect: 'all',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  navigator.clipboard.writeText(activeExam.declarationText);
                  addToast('Declaration template copied to clipboard.', 'success');
                }}
                title="Click to Copy"
              >
                "{activeExam.declarationText}"
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                * Write this in English using black ink on white paper, scan/capture it, and upload it.
              </p>
            </div>
          )}

          {/* Validation & Preview Output */}
          {processedResult && spec && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Resized Output</h4>
              
              {/* Output Preview */}
              <div style={{ textAlign: 'center', marginBottom: '16px', backgroundColor: '#FFFFFF', padding: '12px', border: '1px solid var(--border-color)' }}>
                <img
                  src={processedResult.dataUrl}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '120px',
                    objectFit: 'contain',
                    border: '1px dashed var(--border-color-dark)'
                  }}
                  alt="Resized Result"
                />
              </div>

              {/* Verification Badges */}
              <div className="validation-badges">
                {/* Size weight check */}
                <div className={`badge ${processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB ? 'badge-valid' : 'badge-invalid'}`}>
                  <span>Size Weight: {processedResult.sizeKB} KB</span>
                  <span>
                    {processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB 
                      ? '✓ VALID' 
                      : '✗ INVALID'}
                  </span>
                </div>
                
                {/* Dimensions check in selected unit */}
                <div className={`badge ${processedResult.width === spec.width && processedResult.height === spec.height ? 'badge-valid' : 'badge-invalid'}`}>
                  <span>Resolution: {getFormattedDimensions(activeDoc, unit, processedResult)}</span>
                  <span>
                    {processedResult.width === spec.width && processedResult.height === spec.height 
                      ? '✓ VALID' 
                      : '✗ INVALID'}
                  </span>
                </div>
              </div>

              {/* Add to Batch dashboard */}
              <div style={{ marginTop: '20px' }}>
                <button
                  className="btn-accent"
                  style={{ width: '100%' }}
                  onClick={handleAddToBatchClick}
                  disabled={
                    !(processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB &&
                      processedResult.width === spec.width && processedResult.height === spec.height)
                  }
                >
                  Add to Download Batch
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
