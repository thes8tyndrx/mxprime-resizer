import { useState, useRef, useEffect } from 'react';
import { useImageCrop } from '../hooks/useImageCrop';
import { useCompressToTarget } from '../hooks/useCompressToTarget';
import { useBackgroundRemoval } from '../hooks/useBackgroundRemoval';
import examData from '../data/exam-presets.json';

// Generate PRESETS_LIST dynamically from exam-presets.json
const PRESETS_LIST = [];
Object.entries(examData.exams).forEach(([examId, exam]) => {
  if (examId === 'custom') {
    PRESETS_LIST.push({
      id: 'custom',
      name: 'Custom',
      label: 'Custom\nAny size',
      examId: 'custom',
      category: 'OTHER',
      docType: 'custom',
      width: 300,
      height: 300,
      minKB: 10,
      maxKB: 50,
      unit: 'px',
      dpi: 200
    });
  } else {
    Object.entries(exam.docs).forEach(([docType, doc]) => {
      // Create a nice display label
      let labelText = '';
      if (doc.unit === 'cm') {
        labelText = `${exam.name} ${docType.charAt(0).toUpperCase() + docType.slice(1)}\n(${doc.width}x${doc.height} cm)\n${doc.minKB}-${doc.maxKB} KB`;
      } else if (doc.unit === 'mm') {
        labelText = `${exam.name} ${docType.charAt(0).toUpperCase() + docType.slice(1)}\n(${doc.width}x${doc.height} mm)\n${doc.minKB}-${doc.maxKB} KB`;
      } else {
        labelText = `${exam.name} ${docType.charAt(0).toUpperCase() + docType.slice(1)}\n(${doc.width}x${doc.height} px)\n${doc.minKB}-${doc.maxKB} KB`;
      }

      // Calculate pixel width and height for internal storage in PRESETS_LIST
      let widthPx = doc.width;
      let heightPx = doc.height;
      if (doc.unit === 'cm') {
        widthPx = Math.round((doc.width / 2.54) * (doc.dpi || 200));
        heightPx = Math.round((doc.height / 2.54) * (doc.dpi || 200));
      } else if (doc.unit === 'mm') {
        widthPx = Math.round((doc.width / 25.4) * (doc.dpi || 200));
        heightPx = Math.round((doc.height / 25.4) * (doc.dpi || 200));
      } else if (doc.unit === 'inch') {
        widthPx = Math.round(doc.width * (doc.dpi || 200));
        heightPx = Math.round(doc.height * (doc.dpi || 200));
      }

      PRESETS_LIST.push({
        id: `${examId}-${docType}`,
        name: `${exam.name} ${docType.charAt(0).toUpperCase() + docType.slice(1)}`,
        label: labelText,
        examId: examId,
        category: exam.category,
        docType: docType,
        width: widthPx,
        height: heightPx,
        minKB: doc.minKB,
        maxKB: doc.maxKB,
        unit: doc.unit || 'px',
        dpi: doc.dpi || 200
      });
    });
  }
});

export function ResizerWorkspace({ activeExam, onAddToBatch, addToast }) {
  const [currentExamFilter, setCurrentExamFilter] = useState('NEET');
  const [selectedPresetId, setSelectedPresetId] = useState('neet-ug-photo');
  const [activeDoc, setActiveDoc] = useState('photo');

  // Single source of truth for dimensions always in PIXELS
  const [widthPx, setWidthPx] = useState(276);
  const [heightPx, setHeightPx] = useState(354);
  const [targetMinKB, setTargetMinKB] = useState(10);
  const [targetMaxKB, setTargetMaxKB] = useState(200);
  const [targetUnit, setTargetUnit] = useState('cm'); // 'px', 'cm', 'mm', 'inch'
  const [targetDPI, setTargetDPI] = useState(200);

  // Buffer text inputs to avoid float cursor jump/rounding issues while typing
  const [inputWidth, setInputWidth] = useState('3.5');
  const [inputHeight, setInputHeight] = useState('4.5');

  const [uploadedFile, setUploadedFile] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);

  // Name & Date Overlay states
  const [nameOverlay, setNameOverlay] = useState('');
  const [dateOverlay, setDateOverlay] = useState('');
  
  // Premium Editor parameters
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [skipCrop, setSkipCrop] = useState(false);

  // Undo / Redo History
  const [history, setHistory] = useState([{ rotation: 0, flipH: false, flipV: false, zoom: 1.0, pan: { x: 0, y: 0 } }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // Processed Output
  const [processedResult, setProcessedResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track and revoke Object URLs to prevent memory leaks
  const processedUrlRef = useRef(null);
  const bgRemovalUrlRef = useRef(null);

  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Helper converters
  const getDisplayValue = (px, unitType, dpi) => {
    if (unitType === 'inch') return parseFloat((px / dpi).toFixed(2));
    if (unitType === 'cm') return parseFloat(((px / dpi) * 2.54).toFixed(2));
    if (unitType === 'mm') return Math.round((px / dpi) * 25.4);
    return px;
  };

  const convertToPx = (val, unitType, dpi) => {
    if (unitType === 'inch') return Math.round(val * dpi);
    if (unitType === 'cm') return Math.round((val / 2.54) * dpi);
    if (unitType === 'mm') return Math.round((val / 25.4) * dpi);
    return Math.round(val);
  };

  // Reset editor settings on file upload
  useEffect(() => {
    if (imageSrc) {
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
      setBgColor('#FFFFFF');
      setSkipCrop(false);
      setHistory([{ rotation: 0, flipH: false, flipV: false, zoom: 1.0, pan: { x: 0, y: 0 } }]);
      setHistoryIndex(0);
    }
  }, [imageSrc]);

  // Sync initial presets from parent
  useEffect(() => {
    if (activeExam) {
      const activeCategory = activeExam.category || 'OTHER';
      setCurrentExamFilter(activeCategory);
      const match = PRESETS_LIST.find(p => p.examId === activeExam.id && p.docType === 'photo');
      if (match) {
        handlePresetSelect(match);
      } else if (activeExam.id === 'custom') {
        const customPreset = PRESETS_LIST.find(p => p.id === 'custom');
        if (customPreset) handlePresetSelect(customPreset);
      }
    }
  }, [activeExam]);

  const handlePresetSelect = (preset) => {
    setSelectedPresetId(preset.id);
    setWidthPx(preset.width);
    setHeightPx(preset.height);
    setTargetMinKB(preset.minKB);
    setTargetMaxKB(preset.maxKB);
    setTargetUnit(preset.unit);
    setTargetDPI(preset.dpi);
    setActiveDoc(preset.docType);
    
    // Fill text input buffers — show in the preset's native unit (cm/mm/inch), not raw pixels
    const displayW = getDisplayValue(preset.width, preset.unit, preset.dpi);
    const displayH = getDisplayValue(preset.height, preset.unit, preset.dpi);
    setInputWidth(displayW.toString());
    setInputHeight(displayH.toString());
    
    // Revoke old processed URL before clearing result
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current);
      processedUrlRef.current = null;
    }
    setProcessedResult(null);
  };

  // Active specs used by cropper and compressor
  const spec = {
    width: Math.max(20, widthPx),
    height: Math.max(20, heightPx),
    minKB: targetMinKB,
    maxKB: targetMaxKB,
    aspectRatio: widthPx / heightPx,
    format: 'image/jpeg'
  };

  const {
    crop,
    initCrop,
    isDragging,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
    
    getCroppedImage
  } = useImageCrop(spec.aspectRatio);

  const { isCompressing, compressProgress, compressImage } = useCompressToTarget();
  const { isRemoving, removalProgress, removalError, removeImageBackground } = useBackgroundRemoval();

  // Re-initialize crop coordinates whenever aspect ratio changes
  useEffect(() => {
    if (imageSrc && imgRef.current && spec) {
      const img = imgRef.current;
      if (img.complete) {
        initCrop(img.naturalWidth, img.naturalHeight);
      }
    }
  }, [spec.aspectRatio, imageSrc, initCrop]);

  // Non-passive wheel zoom handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !imageSrc || skipCrop) return;

    const handleWheelEvent = (e) => {
      e.preventDefault();
      const zoomStep = 0.04;
      const newZoom = e.deltaY < 0 
        ? Math.min(3.0, zoom + zoomStep)
        : Math.max(1.0, zoom - zoomStep);
      
      setZoom(newZoom);
    };

    container.addEventListener('wheel', handleWheelEvent, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelEvent);
    };
  }, [zoom, setZoom, imageSrc, skipCrop]);

  const commitToHistory = (newParams) => {
    const nextParams = { rotation, flipH, flipV, zoom, pan, ...newParams };
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push(nextParams);
    if (nextHistory.length > 30) nextHistory.shift();
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      const prev = history[prevIndex];
      setRotation(prev.rotation);
      setFlipH(prev.flipH);
      setFlipV(prev.flipV);
      setZoom(prev.zoom);
      setPan(prev.pan);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      const next = history[nextIndex];
      setRotation(next.rotation);
      setFlipH(next.flipH);
      setFlipV(next.flipV);
      setZoom(next.zoom);
      setPan(next.pan);
    }
  };

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

  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

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

  const handleRemoveBackground = async () => {
    if (!imageSrc) return;
    addToast('Downloading AI models (cached thereafter)... This may take a minute.', 'info');
    const resultBlob = await removeImageBackground(imageSrc);
    if (resultBlob) {
      // Revoke previous BG removal URL to free memory
      if (bgRemovalUrlRef.current) {
        URL.revokeObjectURL(bgRemovalUrlRef.current);
      }
      const resultUrl = URL.createObjectURL(resultBlob);
      bgRemovalUrlRef.current = resultUrl;
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

  const handleResizeAndCompress = async () => {
    if (!imageSrc || !imgRef.current) return;
    setIsProcessing(true);

    try {
      const overlayData = activeDoc === 'photo' && nameOverlay
        ? { name: nameOverlay, date: dateOverlay }
        : null;

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

        // Revoke previous Object URL to free memory
        if (processedUrlRef.current) {
          URL.revokeObjectURL(processedUrlRef.current);
        }
        const previewUrl = URL.createObjectURL(compressResult.blob);
        processedUrlRef.current = previewUrl;

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

  const handleAddToBatchClick = () => {
    if (!processedResult) return;
    
    const filename = `${selectedPresetId}-${activeDoc}.jpg`;
    onAddToBatch({
      id: `${selectedPresetId}-${activeDoc}`,
      examName: selectedPresetId.toUpperCase(),
      docType: activeDoc,
      filename,
      sizeKB: processedResult.sizeKB,
      width: processedResult.width,
      height: processedResult.height,
      blob: processedResult.blob,
      dataUrl: processedResult.dataUrl
    });
    
    addToast('Document added to download batch.', 'success');
  };

  // Convert pixels to display text
  const getFormattedDimensions = (docType, unitType, customSpec = null) => {
    const currentSpec = customSpec || { width: spec.width, height: spec.height };
    if (!currentSpec) return '';

    if (unitType === 'cm') {
      const cmW = (currentSpec.width / (targetDPI / 2.54)).toFixed(1);
      const cmH = (currentSpec.height / (targetDPI / 2.54)).toFixed(1);
      return `${cmW}x${cmH} cm`;
    }
    if (unitType === 'mm') {
      const mmW = Math.round(currentSpec.width / (targetDPI / 25.4));
      const mmH = Math.round(currentSpec.height / (targetDPI / 25.4));
      return `${mmW}x${mmH} mm`;
    }
    if (unitType === 'inch') {
      const inW = (currentSpec.width / targetDPI).toFixed(2);
      const inH = (currentSpec.height / targetDPI).toFixed(2);
      return `${inW}x${inH} inch`;
    }
    return `${currentSpec.width}x${currentSpec.height} px`;
  };

  return (
    <div className="workspace-wrapper">
      <div className="editor-three-col-layout">
        
        {/* Left Column: Preset cards grid & Dimension inputs */}
        <div className="presets-sidebar">
          
          {/* EXAM PRESETS Grid */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title" style={{ marginBottom: '8px' }}>Exam Preset</h4>
            
            {/* Dynamic filter tab buttons */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {[
                { id: 'NEET', label: 'NEET' },
                { id: 'JEE', label: 'JEE' },
                { id: 'SSC', label: 'SSC' },
                { id: 'UPSC', label: 'UPSC' },
                { id: 'SBI', label: 'SBI' },
                { id: 'IBPS', label: 'IBPS' },
                { id: 'RRB', label: 'RRB' },
                { id: 'RBI', label: 'RBI' },
                { id: 'LIC', label: 'LIC' },
                { id: 'OTHER', label: 'Custom' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`exam-tab-btn ${currentExamFilter === tab.id ? 'active' : ''}`}
                  style={{
                    padding: '6px 4px',
                    fontSize: '10px',
                    flexGrow: 1,
                    textAlign: 'center',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '700',
                    borderRadius: '2px',
                    textTransform: 'uppercase'
                  }}
                  onClick={() => {
                    setCurrentExamFilter(tab.id);
                    const firstPreset = PRESETS_LIST.find(p => p.category === tab.id || (tab.id === 'OTHER' && p.id === 'custom'));
                    if (firstPreset) handlePresetSelect(firstPreset);
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="presets-grid">
              {PRESETS_LIST.filter(preset => preset.category === currentExamFilter || (currentExamFilter === 'OTHER' && preset.id === 'custom')).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`preset-card-btn ${selectedPresetId === preset.id ? 'active' : ''}`}
                  onClick={() => handlePresetSelect(preset)}
                >
                  <span className="preset-card-name">{preset.name}</span>
                  <span className="preset-card-label">{preset.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* DIMENSIONS Selection */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">Dimensions</h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Width</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  className="form-input"
                  value={inputWidth}
                  onChange={(e) => {
                    setInputWidth(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    setWidthPx(Math.max(20, convertToPx(val, targetUnit, targetDPI)));
                    setSelectedPresetId('custom');
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Height</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  className="form-input"
                  value={inputHeight}
                  onChange={(e) => {
                    setInputHeight(e.target.value);
                    const val = parseFloat(e.target.value) || 0;
                    setHeightPx(Math.max(20, convertToPx(val, targetUnit, targetDPI)));
                    setSelectedPresetId('custom');
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Unit</label>
                <select
                  className="form-input"
                  value={targetUnit}
                  onChange={(e) => {
                    const newUnit = e.target.value;
                    setTargetUnit(newUnit);
                    setInputWidth(getDisplayValue(widthPx, newUnit, targetDPI).toString());
                    setInputHeight(getDisplayValue(heightPx, newUnit, targetDPI).toString());
                    setSelectedPresetId('custom');
                  }}
                >
                  <option value="px">PX</option>
                  <option value="cm">CM</option>
                  <option value="mm">MM</option>
                  <option value="inch">INCH</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">DPI</label>
                <input
                  type="number"
                  min="72"
                  max="1200"
                  className="form-input"
                  value={targetDPI}
                  onChange={(e) => {
                    const parsed = parseInt(e.target.value);
                    const newDPI = Math.max(72, isNaN(parsed) ? 200 : parsed);
                    setTargetDPI(newDPI);
                    
                    // Update pixel value based on new DPI to keep displayed units constant
                    const wVal = parseFloat(inputWidth) || 0;
                    const hVal = parseFloat(inputHeight) || 0;
                    setWidthPx(Math.max(20, convertToPx(wVal, targetUnit, newDPI)));
                    setHeightPx(Math.max(20, convertToPx(hVal, targetUnit, newDPI)));
                    setSelectedPresetId('custom');
                  }}
                />
              </div>
            </div>
          </div>

          {/* FILE SIZE limits */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">File Size (KB)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Min KB</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={targetMinKB}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 10);
                    setTargetMinKB(val);
                    setSelectedPresetId('custom');
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Max KB</label>
                <input
                  type="number"
                  min="5"
                  className="form-input"
                  value={targetMaxKB}
                  onChange={(e) => {
                    const val = Math.max(5, parseInt(e.target.value) || 50);
                    setTargetMaxKB(val);
                    setSelectedPresetId('custom');
                  }}
                />
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column: Interactive cropper preview canvas & Actions */}
        <div className="middle-editor-area">
          
          {imageSrc ? (
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              
              {/* Compact SVG Icon Toolbar */}
              <div className="editor-toolbar">
                {/* Zoom group */}
                {!skipCrop && (
                  <div className="toolbar-group">
                    <button
                      type="button" className="toolbar-btn"
                      title="Zoom Out"
                      onClick={() => { const val = Math.max(1.0, zoom - 0.1); setZoom(val); commitToHistory({ zoom: val }); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/><line x1="4.5" y1="6.5" x2="8.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                    <button
                      type="button" className="toolbar-btn"
                      title="Zoom In"
                      onClick={() => { const val = Math.min(3.0, zoom + 0.1); setZoom(val); commitToHistory({ zoom: val }); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.5"/><line x1="6.5" y1="4.5" x2="6.5" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="4.5" y1="6.5" x2="8.5" y2="6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                )}

                <div className="toolbar-sep" />

                {/* Rotate group */}
                <div className="toolbar-group">
                  <button
                    type="button" className="toolbar-btn"
                    title="Rotate Counter-Clockwise"
                    onClick={() => { const val = (rotation - 90 + 360) % 360; setRotation(val); commitToHistory({ rotation: val }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8a4.5 4.5 0 1 0 .9-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 3.5V6H1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    type="button" className="toolbar-btn"
                    title="Rotate Clockwise"
                    onClick={() => { const val = (rotation + 90) % 360; setRotation(val); commitToHistory({ rotation: val }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12.5 8a4.5 4.5 0 1 1-.9-2.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 3.5V6h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div className="toolbar-sep" />

                {/* Flip group */}
                <div className="toolbar-group">
                  <button
                    type="button" className={`toolbar-btn${flipH ? ' active' : ''}`}
                    title="Flip Horizontal"
                    onClick={() => { const val = !flipH; setFlipH(val); commitToHistory({ flipH: val }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/><path d="M5 4L2 8l3 4V4z" fill="currentColor" opacity=".7"/><path d="M11 4l3 4-3 4V4z" fill="currentColor" opacity=".7"/></svg>
                  </button>
                  <button
                    type="button" className={`toolbar-btn${flipV ? ' active' : ''}`}
                    title="Flip Vertical"
                    onClick={() => { const val = !flipV; setFlipV(val); commitToHistory({ flipV: val }); }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/><path d="M4 5l4-3 4 3H4z" fill="currentColor" opacity=".7"/><path d="M4 11l4 3 4-3H4z" fill="currentColor" opacity=".7"/></svg>
                  </button>
                </div>

                <div className="toolbar-sep" />

                {/* Undo / Redo */}
                <div className="toolbar-group">
                  <button
                    type="button" className="toolbar-btn"
                    title="Undo"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8a5 5 0 1 0 1.1-3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M4 3.5V7H1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button
                    type="button" className="toolbar-btn"
                    title="Redo"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13 8a5 5 0 1 1-1.1-3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 3.5V7h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                <div className="toolbar-sep" />

                {/* Reset */}
                <button
                  type="button"
                  className="toolbar-btn toolbar-btn-reset"
                  title="Reset all transforms"
                  onClick={() => {
                    setZoom(1.0); setPan({ x: 0, y: 0 });
                    setRotation(0); setFlipH(false); setFlipV(false);
                    setBrightness(100); setContrast(100); setBgColor('#FFFFFF');
                    setHistory([{ rotation: 0, flipH: false, flipV: false, zoom: 1.0, pan: { x: 0, y: 0 } }]);
                    setHistoryIndex(0);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4.3 4.3 8 8m0 0 3.7 3.7M8 8 11.7 4.3M8 8 4.3 11.7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  <span className="toolbar-btn-label">Reset</span>
                </button>
              </div>

              {/* Canvas workspace checkerboard area (Larger 560px Height) */}
              <div className="checkerboard-bg" style={{ display: 'flex', justifyContent: 'center', padding: '16px', borderLeft: '1px solid #334155', borderRight: '1px solid #334155' }}>
                <div
                  className="cropper-wrapper"
                  ref={containerRef}
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    overflow: 'hidden',
                    maxWidth: '100%',
                    maxHeight: '560px',
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

              {/* Status bar */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#292524',
                color: '#A8A29E',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                fontWeight: '700',
                padding: '8px 16px',
                borderBottomLeftRadius: '2px',
                borderBottomRightRadius: '2px',
                border: '1px solid #44403C',
                borderTop: 'none',
                width: '100%',
                flexWrap: 'wrap'
              }}>
                <span>⚖️ SIZE: {processedResult ? `~${processedResult.sizeKB} KB` : 'WAITING PROCESS'}</span>
                <span>📏 DIMS: {getFormattedDimensions(activeDoc, targetUnit)} ({spec.width}x{spec.height}px)</span>
              </div>

              {/* Primary Actions */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', flexWrap: 'wrap' }}>
                <button
                  className="btn-accent"
                  style={{ flexGrow: 1, padding: '12px' }}
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
                >
                  Clear File
                </button>
              </div>

            </div>
          ) : (
            <div
              className="upload-zone"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
              style={{ width: '100%', minHeight: '360px' }}
            >
              <span className="upload-icon">✦</span>
              <h3 className="upload-title">Drag & drop your image here</h3>
              <p className="upload-sub">or click to browse from your device</p>
              <span className="upload-sub" style={{ fontSize: '11px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Target: {getFormattedDimensions(activeDoc, targetUnit)} · {spec.minKB}-{spec.maxKB} KB
              </span>
              
              <input
                id="fileInput"
                type="file"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/jpeg, image/jpg, image/png, image/webp"
              />
            </div>
          )}

          {/* Compliance alert */}
          <div className="legal-card-container">
            <div className="legal-card">
              ⚠️ <b>Compliance Warning:</b> Government upload portals validate the file size and resolution down to the exact pixel. Always verify that your final downloads match the official criteria before final form submission.
            </div>
          </div>

        </div>

        {/* Right Column: Adjustments & Quality Checks */}
        <div className="adjustments-sidebar">
          
          {/* ADJUSTMENTS card */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">Adjustments</h4>
            
            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="skipCropCheck"
                checked={skipCrop}
                onChange={(e) => setSkipCrop(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="skipCropCheck" className="form-label" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
                Resize Only (Disable Crop Frame)
              </label>
            </div>

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
                disabled={!imageSrc}
              />
            </div>

            <div className="form-group">
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
                disabled={!imageSrc}
              />
            </div>
          </div>

          {/* BACKGROUND Color Filler */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">Background</h4>
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
                    gap: '4px'
                  }}
                  onClick={() => setBgColor(color.hex)}
                  disabled={!imageSrc}
                >
                  <span style={{
                    width: '8px',
                    height: '8px',
                    backgroundColor: color.hex,
                    borderRadius: '50%',
                    border: '1px solid #44403C'
                  }}></span>
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* QUALITY CHECK list */}
          <div className="sidebar-block">
            <h4 className="sidebar-block-title">Quality Check</h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{
                  color: processedResult && processedResult.width === spec.width && processedResult.height === spec.height 
                    ? '#10B981' 
                    : '#EF4444',
                  fontWeight: 'bold'
                }}>
                  {processedResult && processedResult.width === spec.width && processedResult.height === spec.height ? '✓' : '●'}
                </span>
                <span>Resolution: {processedResult ? `${processedResult.width}x${processedResult.height} px` : `${spec.width}x${spec.height} px`}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{
                  color: processedResult && processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB 
                    ? '#10B981' 
                    : '#EF4444',
                  fontWeight: 'bold'
                }}>
                  {processedResult && processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB ? '✓' : '●'}
                </span>
                <span>Size KB: {processedResult ? `${processedResult.sizeKB} KB` : `${spec.minKB}-${spec.maxKB} KB`}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#10B981', fontWeight: 'bold' }}>✓</span>
                <span>Format: JPG / JPEG</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <span style={{
                  color: bgColor !== '#FFFFFF' || !imageSrc ? '#10B981' : '#F59E0B',
                  fontWeight: 'bold'
                }}>
                  {bgColor !== '#FFFFFF' || !imageSrc ? '✓' : '●'}
                </span>
                <span>Background Check</span>
              </div>
            </div>

            {activeDoc === 'photo' && imageSrc && (
              <div style={{ marginTop: '16px', borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '10px' }}>Name Overlay</label>
                  <input
                    type="text"
                    placeholder="E.g., RAJESH KUMAR"
                    className="form-input"
                    value={nameOverlay}
                    onChange={(e) => setNameOverlay(e.target.value)}
                    style={{ padding: '6px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '10px' }}>Date Overlay</label>
                  <input
                    type="text"
                    placeholder="E.g., 05/07/2026"
                    className="form-input"
                    value={dateOverlay}
                    onChange={(e) => setDateOverlay(e.target.value)}
                    style={{ padding: '6px' }}
                  />
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px' }}>
              <button
                className="btn-primary"
                style={{ width: '100%' }}
                onClick={handleAddToBatchClick}
                disabled={
                  !processedResult ||
                  !(processedResult.sizeKB >= spec.minKB && processedResult.sizeKB <= spec.maxKB &&
                    processedResult.width === spec.width && processedResult.height === spec.height)
                }
              >
                Add to Download Batch
              </button>
            </div>
          </div>

          {processedResult && (
            <div className="sidebar-block">
              <h4 className="sidebar-block-title">Output Preview</h4>
              <div style={{ textAlign: 'center', backgroundColor: '#FFFFFF', padding: '8px', border: '1px solid var(--border-color)' }}>
                <img
                  src={processedResult.dataUrl}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '120px',
                    objectFit: 'contain',
                    border: '1px dashed var(--border-color-dark)'
                  }}
                  alt="Output"
                />
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
