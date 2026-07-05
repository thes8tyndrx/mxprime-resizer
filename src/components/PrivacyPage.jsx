export function PrivacyPage({ onBack }) {
  return (
    <div className="legal-page">
      <div className="container">
        <button className="back-button" onClick={onBack}>← Back to Home</button>

        <div className="legal-header">
          <div className="eyebrow-tag">LEGAL</div>
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-meta">Last updated: July 2026 · Effective immediately · Developer: MxPrime (Satyendra Singh Dhakad)</p>
        </div>

        <div className="legal-body">

          <div className="legal-highlight-box">
            <strong>🔒 Plain English Summary:</strong> MxPrime Resizer processes all your images
            entirely inside your browser. We never see, collect, store, or transmit your photos, 
            signatures, or any other uploaded files. Zero servers. Zero tracking.
          </div>

          <h2>1. Who We Are</h2>
          <p>
            MxPrime Resizer ("we", "us", "our") is a free, client-side web application developed by
            <strong> Satyendra Singh Dhakad</strong>, operating under the brand <strong>MxPrime</strong>.
            It helps students resize and compress photographs and signatures for Indian competitive
            exam applications (NEET, JEE, SSC, UPSC, IBPS, SBI, RRB, RBI, LIC, and others).
            The service is provided free of charge as a public utility tool.
          </p>

          <h2>2. Information We Do NOT Collect</h2>
          <p>We want to be crystal clear about what does <strong>not</strong> happen:</p>
          <ul>
            <li>We do <strong>not</strong> upload your photographs, signatures, or any images to any server.</li>
            <li>We do <strong>not</strong> store any images in a database, cloud storage, or file system.</li>
            <li>We do <strong>not</strong> collect your name, email, phone number, or any personal identifiers.</li>
            <li>We do <strong>not</strong> use cookies for tracking or profiling.</li>
            <li>We do <strong>not</strong> use third-party analytics (Google Analytics, Hotjar, etc.).</li>
            <li>We do <strong>not</strong> sell, share, or monetize any user data in any form.</li>
          </ul>

          <h2>3. How the App Works (Technical Detail)</h2>
          <p>
            All image processing — including cropping, resizing, compression, and AI background
            removal — is performed entirely using your device's CPU and RAM through browser-native
            APIs (Canvas API, WebAssembly). The uploaded files exist only as temporary in-memory
            data inside your browser session (as JavaScript objects and Object URLs).
          </p>
          <p>
            When you close the browser tab or navigate away, all session data is automatically
            and permanently cleared by the browser. There is no "save" mechanism — nothing persists.
          </p>

          <h2>4. Third-Party Services</h2>
          <p>The following third-party resources are loaded when you use MxPrime Resizer:</p>
          <ul>
            <li>
              <strong>Google Fonts:</strong> The fonts Inter, Space Grotesk, and Space Mono are
              loaded from Google's CDN (<code>fonts.googleapis.com</code>). Google may log
              the font request as a standard HTTP request (your IP, browser type). No cookies
              are set.{' '}
              <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
                Google Privacy Policy →
              </a>
            </li>
            <li>
              <strong>@imgly/background-removal (WASM model):</strong> The AI background removal
              feature downloads a WebAssembly model file (~50MB) from a CDN on first use. This
              file is then cached by your browser for future visits. No image data is sent to
              any server during processing.
            </li>
          </ul>
          <p>
            If we add Google AdSense ads in the future, we will update this policy to reflect
            Google's use of cookies for ad personalization, and provide an opt-out mechanism.
          </p>

          <h2>5. Advertising (Planned)</h2>
          <p>
            We may display non-intrusive advertisements via Google AdSense in the future to
            support the free operation of this service. If and when ads are enabled:
          </p>
          <ul>
            <li>Google may use cookies to serve personalized ads based on your browsing history.</li>
            <li>You can opt out via <a href="https://myadcenter.google.com/" target="_blank" rel="noreferrer">Google My Ad Center</a>.</li>
            <li>We will add a cookie consent banner before enabling ads.</li>
            <li>This Privacy Policy will be updated with the specific AdSense section.</li>
          </ul>

          <h2>6. Children's Privacy</h2>
          <p>
            MxPrime Resizer does not knowingly collect personal information from children under 13.
            The app does not require account registration. If you are under 13, please use this
            tool with parental guidance.
          </p>

          <h2>7. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy as the app evolves (e.g., when ads are added).
            The "Last updated" date at the top will always reflect the most recent revision.
            Continued use of the app after changes constitutes acceptance of the updated policy.
          </p>

          <h2>8. Contact</h2>
          <p>
            For any privacy-related questions, concerns, or data requests, contact the developer:
            <br />
            <strong>Developer:</strong> Satyendra Singh Dhakad (MxPrime)
            <br />
            <strong>Email:</strong>{' '}
            <a href="mailto:thes8tyndrx@gmail.com">thes8tyndrx@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
