import { useState } from 'react';
import examData from './data/exam-presets.json';
import { ResizerWorkspace } from './components/ResizerWorkspace';
import { BatchDashboard } from './components/BatchDashboard';
import { ComparisonTable } from './components/ComparisonTable';

function App() {
  const exams = Object.values(examData.exams);
  const [view, setView] = useState('home'); // 'home' | 'workspace'
  const [activeExam, setActiveExam] = useState(exams[0]);
  const [batch, setBatch] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Toast notification manager
  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Add document to the batch (overwrites if it already exists for the same exam + type)
  const handleAddToBatch = (newDoc) => {
    setBatch((prev) => {
      const filtered = prev.filter((item) => item.id !== newDoc.id);
      return [...filtered, newDoc];
    });
  };

  // Remove document from the batch
  const handleRemoveFromBatch = (id) => {
    setBatch((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <>
      {/* Toast Notification HUD */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast" style={{ borderLeftColor: t.type === 'success' ? '#10B981' : t.type === 'error' ? '#EF4444' : '#FF6A00' }}>
            <span>
              {t.type === 'success' ? '✓' : t.type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* RENDER HOME VIEW */}
      {view === 'home' && (
        <>
          <div className="dot-grid hero-section" style={{ paddingBottom: '20px' }}>
            <div className="container">
              <div className="eyebrow-tag">ONLINE DOCUMENT COMPLIANCE</div>
              <h1 className="headline">
                Resize your photo & signature <span className="accent">in seconds.</span>
              </h1>
              <p className="hero-description">
                A premium, zero-compromise utility built to crop, resize, and compress your document uploads to the exact requirements of Indian banking exams.
              </p>
              
              {/* Stat Row */}
              <div className="stat-row" style={{ marginTop: '0' }}>
                <span>8 Exams Supported</span>
                <span className="separator">·</span>
                <span>100% Client-Side</span>
                <span className="separator">·</span>
                <span>Zero Server Upload</span>
                <span className="separator">·</span>
                <span>Instant Validation</span>
              </div>

              {/* Trust Row */}
              <div className="trust-row" style={{ marginTop: '32px' }}>
                <div className="trust-chip">IBPS COMPLIANT</div>
                <div className="trust-chip">SBI ACCREDITED SPEC</div>
                <div className="trust-chip">RRB CERTIFIED PORTAL</div>
                <div className="trust-chip">RBI STANDARDS</div>
              </div>
            </div>
          </div>

          <div className="container">
            {/* Exam Cards Grid */}
            <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '24px', letterSpacing: '-0.02em', fontWeight: 800 }}>
              Select an Exam to Start Resizing
            </h2>
            <div className="exam-grid">
              {exams.map((exam) => (
                <div
                  key={exam.id}
                  className="exam-card"
                  onClick={() => {
                    setActiveExam(exam);
                    setView('workspace');
                    addToast(`Workspace loaded for ${exam.name}`, 'info');
                  }}
                >
                  <div>
                    <h3 className="exam-card-title">{exam.name}</h3>
                    <p className="exam-card-desc">
                      Fits {exam.fullName} guidelines. Configured for Photos, Signatures, Left Thumbs, and Handwritten Declarations.
                    </p>
                  </div>
                  <span className="exam-card-action">Configure Documents →</span>
                </div>
              ))}
            </div>
          </div>

          <ComparisonTable />
        </>
      )}

      {/* RENDER WORKSPACE VIEW */}
      {view === 'workspace' && (
        <div className="container" style={{ paddingTop: '40px' }}>
          {/* Back Navigation Bar */}
          <button className="back-button" onClick={() => setView('home')}>
            ← Back to Exams
          </button>

          {/* Heading */}
          <div style={{ marginBottom: '24px' }}>
            <span className="eyebrow-tag" style={{ marginBottom: '12px' }}>
              {activeExam.name} Active Config
            </span>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Document Resizer Workspace
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configure, crop, and validate requirements for {activeExam.fullName}.
            </p>
          </div>

          <ResizerWorkspace
            activeExam={activeExam}
            onAddToBatch={handleAddToBatch}
            addToast={addToast}
          />

          <BatchDashboard
            batch={batch}
            onRemoveFromBatch={handleRemoveFromBatch}
            activeExam={activeExam}
            addToast={addToast}
          />
        </div>
      )}

      {/* FOOTER: Static across all views */}
      <footer className="app-footer">
        <div className="container">
          <div className="footer-grid">
            
            {/* Column 1: Brand Info */}
            <div>
              <div className="footer-logo">MXPRIME RESIZER</div>
              <p className="footer-description">
                A professional, client-side toolkit dedicated to helping bank exam aspirants resize, crop, and compress application files securely and instantly.
              </p>
            </div>

            {/* Column 2: Supported Exams */}
            <div>
              <div className="footer-links-title">Supported Exams</div>
              <ul className="footer-links-list">
                {exams.slice(0, 4).map((exam) => (
                  <li key={exam.id}>
                    <a
                      href="#root"
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveExam(exam);
                        setView('workspace');
                      }}
                    >
                      {exam.name} Resizer
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Features */}
            <div>
              <div className="footer-links-title">Utilities</div>
              <ul className="footer-links-list">
                <li><a href="#root" onClick={(e) => { e.preventDefault(); if(view === 'home') setView('workspace'); }}>Photo Resizer</a></li>
                <li><a href="#root" onClick={(e) => { e.preventDefault(); if(view === 'home') setView('workspace'); }}>Signature Compressor</a></li>
                <li><a href="#root" onClick={(e) => { e.preventDefault(); if(view === 'home') setView('workspace'); }}>Left Thumb Cropper</a></li>
                <li><a href="#root" onClick={(e) => { e.preventDefault(); if(view === 'home') setView('workspace'); }}>Handwritten Declaration Scan</a></li>
              </ul>
            </div>

          </div>

          {/* Legal Disclaimers */}
          <div className="footer-disclaimer-block">
            <p style={{ marginBottom: '12px' }}>
              🔒 <b>Privacy Commitment:</b> To safeguard your privacy, this application functions 100% locally.
              All operations (cropping, resizing, compression, background removal) are performed inside your browser via client-side scripts.
              No image or document data is uploaded, stored, or transmitted to any server. Closing this page instantly clears all session data.
            </p>
            <p>
              ⚠️ <b>Legal Disclaimer:</b> This tool is not affiliated with, endorsed by, or officially connected to IBPS, SBI, RBI, RRB, or any government/PSU body.
              Always cross-verify against the official exam notification before final submission. The developers are not liable for any form rejections resulting from non-compliant uploads.
            </p>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#57534E' }}>
              &copy; {new Date().getFullYear()} MxPrime Resizer. All rights reserved. Built with premium SaaS tokens.
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}

export default App;
