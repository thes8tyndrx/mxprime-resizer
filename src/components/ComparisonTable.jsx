export function ComparisonTable() {
  return (
    <div className="comparison-section">
      <div className="container">
        <h2 className="comparison-title">Stop wasting time in Paint & Photoshop</h2>
        
        <table className="comparison-table">
          <thead>
            <tr>
              <th className="col-header-left">Feature</th>
              <th className="col-header-mid">Manual Resize (Paint / PS)</th>
              <th className="col-header-right">This Tool (MxPrime Resizer)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="col-left">Preset Compliance</td>
              <td className="col-mid">None. You must manually lookup dimensions and sizes in the notification PDF.</td>
              <td className="col-right">Automated. Preloaded official parameters for 13+ banking, SSC, UPSC & RRB exams.</td>
            </tr>
            <tr>
              <td className="col-left">Target File Compression</td>
              <td className="col-mid">Trial and error. Exporting repeatedly with different qualities.</td>
              <td className="col-right">Instant. Binary-search compression optimizes quality to match target KB.</td>
            </tr>
            <tr>
              <td className="col-left">File Size Minimums</td>
              <td className="col-mid">No support. Simple images remain too small, getting rejected by portals.</td>
              <td className="col-right">Supported. Automated invisible padding guarantees meeting minimum KB limits.</td>
            </tr>
            <tr>
              <td className="col-left">Background Eraser</td>
              <td className="col-mid">Requires Photoshop magnetic lasso or paying for commercial AI tools.</td>
              <td className="col-right">100% Free & Local. Powered by client-side AI WASM background erasers.</td>
            </tr>
            <tr>
              <td className="col-left">Client-Side Privacy</td>
              <td className="col-mid">Local, but complex. Alternative online sites upload images to servers.</td>
              <td className="col-right">100% Local. Zero servers, zero uploads. Runs completely in your browser.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
