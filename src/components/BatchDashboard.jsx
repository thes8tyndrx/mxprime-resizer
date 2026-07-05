import JSZip from 'jszip';

export function BatchDashboard({ batch, onRemoveFromBatch, activeExam, addToast }) {
  if (batch.length === 0) return null;

  // Individual file download trigger
  const handleDownloadItem = (item) => {
    const a = document.createElement('a');
    a.href = item.dataUrl;
    a.download = item.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addToast(`Downloading ${item.filename}...`, 'info');
  };

  // Compile all files into a ZIP archive and download
  const handleDownloadZip = async () => {
    try {
      const zip = new JSZip();
      
      batch.forEach((item) => {
        zip.file(item.filename, item.blob);
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);

      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `${activeExam.id}-resized-documents.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      addToast('ZIP archive downloaded successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to generate ZIP archive.', 'error');
    }
  };

  const getDocLabel = (type) => {
    switch (type) {
      case 'photo': return 'Photo';
      case 'signature': return 'Signature';
      case 'thumb': return 'Thumb';
      case 'declaration': return 'Declaration';
      default: return type;
    }
  };

  return (
    <div className="batch-dashboard">
      <div className="batch-title">
        <span>Download Dashboard</span>
        <span className="batch-badge">{batch.length} {batch.length === 1 ? 'document' : 'documents'} ready</span>
      </div>

      <div className="batch-list">
        {batch.map((item) => (
          <div key={item.id} className="batch-card">
            <img src={item.dataUrl} className="batch-card-img" alt={item.docType} />
            <div className="batch-card-info">
              <div className="batch-card-title">{getDocLabel(item.docType)}</div>
              <div className="batch-card-meta">{item.width}x{item.height} px · {item.sizeKB} KB</div>
            </div>
            
            <button
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', border: '1px solid #44403C', color: '#FFFFFF', backgroundColor: 'transparent' }}
              onClick={() => handleDownloadItem(item)}
            >
              Download
            </button>

            <button
              className="batch-card-delete"
              onClick={() => onRemoveFromBatch(item.id)}
              title="Remove from batch"
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button className="btn-accent" onClick={handleDownloadZip}>
          Download All as ZIP
        </button>
        <button
          className="btn-secondary"
          style={{ borderColor: '#44403C', color: '#FFFFFF' }}
          onClick={() => {
            batch.forEach(item => onRemoveFromBatch(item.id));
            addToast('Batch cleared.', 'info');
          }}
        >
          Clear Batch
        </button>
      </div>
    </div>
  );
}
