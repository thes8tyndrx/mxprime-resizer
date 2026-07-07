import { useState } from 'react';
import examData from './data/exam-presets.json';
import { ResizerWorkspace } from './components/ResizerWorkspace';
import { BatchDashboard } from './components/BatchDashboard';
import { ComparisonTable } from './components/ComparisonTable';
import { PrivacyPage } from './components/PrivacyPage';
import { TermsPage } from './components/TermsPage';

function App() {
  const exams = Object.values(examData.exams).filter((exam) => exam.id !== 'custom');
  const [view, setView] = useState('home'); // 'home' | 'workspace' | 'privacy' | 'terms'
  const [activeExam, setActiveExam] = useState(exams[0]);
  const [batch, setBatch] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

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
          <div key={t.id} className="toast" style={{ borderLeftColor: t.type === 'success' ? '#10B981' : t.type === 'error' ? '#EF4444' : 'var(--accent)' }}>
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
          <div className="grid-pattern hero-section" style={{ paddingBottom: '20px' }}>
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
                <span>{Object.keys(examData.exams).filter(k => k !== 'custom').length} Exams Supported</span>
                <span className="separator">·</span>
                <span>100% Client-Side</span>
                <span className="separator">·</span>
                <span>Zero Server Upload</span>
                <span className="separator">·</span>
                <span>Instant Validation</span>
              </div>

              {/* Trust Row */}
              <div className="trust-row" style={{ marginTop: '32px' }}>
                <div className="trust-chip">OFFLINE FIRST</div>
                <div className="trust-chip">ZERO DATA UPLOAD</div>
                <div className="trust-chip">JPEG COMPLIANT OUTPUT</div>
                <div className="trust-chip">RESEARCH-BACKED SPECS</div>
              </div>
            </div>
          </div>

          <div className="container">
            {/* Exam Cards Grid */}
            <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '24px', letterSpacing: '-0.02em', fontWeight: 800 }}>
              Select an Exam to Start Resizing
            </h2>

            {/* Search Bar */}
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search exams (e.g. SSC, IBPS, NEET)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  &times;
                </button>
              )}
            </div>

            <div className="exam-grid">
              {exams
                .filter((exam) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    exam.name.toLowerCase().includes(query) ||
                    exam.fullName.toLowerCase().includes(query)
                  );
                })
                .map((exam) => {
                const docKeys = Object.keys(exam.docs || {});
                const docLabels = { photo: 'Photos', signature: 'Signatures', thumb: 'Thumb Impressions', declaration: 'Declarations', postcard: 'Postcard Photos', fingerprints: 'Fingerprints', custom: 'Custom Sizes' };
                const docsDesc = docKeys.map(k => docLabels[k] || k).join(', ');
                return (
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
                        {exam.fullName}. Configured for: {docsDesc}.
                      </p>
                    </div>
                    <span className="exam-card-action">Configure Documents →</span>
                  </div>
                );
              })}

              {/* Custom Resize Card */}
              <div
                className="exam-card"
                style={{ borderColor: 'var(--accent)', background: 'var(--accent-translucent)' }}
                onClick={() => {
                  setActiveExam({ id: 'custom', name: 'Custom', fullName: 'Custom Resizer (Any Exam)', category: 'OTHER' });
                  setView('workspace');
                  addToast('Custom Resizer Workspace loaded', 'info');
                }}
              >
                <div>
                  <div className="eyebrow-tag" style={{ border: '1px solid var(--accent)', color: 'var(--accent)', display: 'inline-block', marginBottom: '8px', fontSize: '9px', padding: '1px 4px' }}>GENERIC</div>
                  <h3 className="exam-card-title" style={{ marginTop: '4px' }}>Custom Resize</h3>
                  <p className="exam-card-desc">
                    Manually define width, height, unit (px/cm/mm/inch), target KB range, and DPI. Works for SSC, Railway, and State Exams.
                  </p>
                </div>
                <span className="exam-card-action" style={{ color: 'var(--accent)' }}>Configure Custom →</span>
              </div>
            </div>
            {exams.filter((exam) => {
              const query = searchQuery.toLowerCase();
              return (
                exam.name.toLowerCase().includes(query) ||
                exam.fullName.toLowerCase().includes(query)
              );
            }).length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '13px', background: '#FAF9F6', border: '1px dashed var(--border-color-dark)', borderRadius: '2px', marginTop: '16px' }}>
                🔍 No matching exams found for &ldquo;{searchQuery}&rdquo;. Try searching for &ldquo;SSC&rdquo;, &ldquo;IBPS&rdquo;, or &ldquo;NEET&rdquo;.
              </div>
            )}
          </div>

          <ComparisonTable />
        </>
      )}

      {/* RENDER WORKSPACE VIEW */}
      {view === 'workspace' && (
        <div className="workspace-container">
          {/* Header Section */}
          <div className="workspace-header">
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
          </div>

          <div className={`workspace-body-layout ${batch.length > 0 ? 'has-batch' : 'no-batch'}`}>
            <div className="workspace-main-panel">
              <ResizerWorkspace
                activeExam={activeExam}
                onAddToBatch={handleAddToBatch}
                addToast={addToast}
              />
            </div>

            {batch.length > 0 && (
              <div className="workspace-dashboard-panel">
                <BatchDashboard
                  batch={batch}
                  onRemoveFromBatch={handleRemoveFromBatch}
                  activeExam={activeExam}
                  addToast={addToast}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRIVACY PAGE */}
      {view === 'privacy' && (
        <PrivacyPage onBack={() => setView('home')} />
      )}

      {/* TERMS PAGE */}
      {view === 'terms' && (
        <TermsPage onBack={() => setView('home')} />
      )}

      {/* FOOTER: Static across all views */}
      <footer className="app-footer">
        <div className="container">
          <div className="footer-grid">
            
            {/* Column 1: Brand Info */}
            <div>
              <div className="footer-logo">MXPRIME RESIZER</div>
              <p className="footer-description">
                A professional, client-side toolkit dedicated to helping government &amp; competitive exam aspirants resize, crop, and compress application files securely and instantly.
              </p>
            </div>

            {/* Column 2: Supported Exams */}
            <div>
              <div className="footer-links-title">Supported Exams</div>
              <ul className="footer-links-list">
                {[
                  exams.find(e => e.id === 'neet-ug'),
                  exams.find(e => e.id === 'ssc-cgl'),
                  exams.find(e => e.id === 'upsc-cse'),
                  exams.find(e => e.id === 'sbi-po'),
                  exams.find(e => e.id === 'ibps-po'),
                  exams.find(e => e.id === 'rrb-ntpc'),
                ].filter(Boolean).map((exam) => (
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

            {/* Column 4: Legal */}
            <div>
              <div className="footer-links-title">Legal</div>
              <ul className="footer-links-list">
                <li>
                  <a href="#privacy" onClick={(e) => { e.preventDefault(); setView('privacy'); window.scrollTo(0, 0); }}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#terms" onClick={(e) => { e.preventDefault(); setView('terms'); window.scrollTo(0, 0); }}>
                    Terms of Service
                  </a>
                </li>
                <li><a href="mailto:privacy@mxprime.in">Contact Us</a></li>
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
              ⚠️ <b>Legal Disclaimer:</b> This tool is not affiliated with, endorsed by, or officially connected to IBPS, SBI, RBI, RRB, SSC, UPSC, NTA (NEET/JEE), LIC, or any government/PSU body.
              Always cross-verify against the official exam notification before final submission. The developers are not liable for any form rejections resulting from non-compliant uploads.
            </p>
            <p style={{ marginTop: '16px', textAlign: 'center', color: '#57534E' }}>
              &copy; {new Date().getFullYear()} MxPrime Resizer. All rights reserved.&nbsp;
              <a href="#privacy" style={{ color: '#78716C', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setView('privacy'); window.scrollTo(0, 0); }}>Privacy Policy</a>
              {' · '}
              <a href="#terms" style={{ color: '#78716C', textDecoration: 'underline' }} onClick={(e) => { e.preventDefault(); setView('terms'); window.scrollTo(0, 0); }}>Terms of Service</a>
            </p>
          </div>

        </div>
      </footer>
    </>
  );
}

export default App;
