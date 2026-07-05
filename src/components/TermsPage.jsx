export function TermsPage({ onBack }) {
  return (
    <div className="legal-page">
      <div className="container">
        <button className="back-button" onClick={onBack}>← Back to Home</button>

        <div className="legal-header">
          <div className="eyebrow-tag">LEGAL</div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-meta">Last updated: July 2026 · Effective immediately · Developer: MxPrime (Satyendra Singh Dhakad)</p>
        </div>

        <div className="legal-body">

          <div className="legal-highlight-box">
            <strong>📋 Plain English Summary:</strong> This is a free tool. Use it responsibly.
            We are not affiliated with any exam board. Always verify your final file against the
            official notification. We are not responsible if your form gets rejected.
          </div>

          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using MxPrime Resizer (the "Service"), you agree to be bound by these
            Terms of Service. If you do not agree with any part of these terms, please discontinue
            use of the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            MxPrime Resizer is a free, browser-based utility that allows users to resize, crop,
            and compress digital images to meet the specifications of Indian competitive exam
            application portals including but not limited to NEET UG, JEE Main, SSC CGL/CHSL,
            UPSC CSE, IBPS PO/Clerk, SBI PO/Clerk, RRB NTPC, RBI, and LIC AAO.
          </p>

          <h2>3. Free to Use / No Registration</h2>
          <p>
            The Service is provided free of charge. No account registration, login, or payment
            is required. We reserve the right to introduce optional premium features in the
            future without prior notice.
          </p>

          <h2>4. No Official Affiliation</h2>
          <p>
            MxPrime Resizer is an independent tool. It is <strong>not affiliated with, endorsed by,
            sponsored by, or officially connected to</strong> IBPS, SBI, RBI, RRB, SSC, UPSC,
            National Testing Agency (NTA), LIC, or any other government body, PSU, or examination
            conducting authority.
          </p>
          <p>
            The dimension and file size specifications provided in this tool are based on publicly
            available official notifications and are subject to change. We make no guarantee that
            the specifications are current or complete.
          </p>

          <h2>5. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Always verify the output file against the <strong>official notification</strong> for your specific exam and year before submitting.</li>
            <li>Use the Service only for lawful purposes.</li>
            <li>Not attempt to reverse-engineer, scrape, or misuse the Service.</li>
            <li>Not upload images of other individuals without their consent.</li>
          </ul>

          <h2>6. Disclaimer of Warranties</h2>
          <p>
            The Service is provided "as is" and "as available" without any warranties of any kind,
            either express or implied. We do not warrant that:
          </p>
          <ul>
            <li>The output files will be accepted by any specific exam portal.</li>
            <li>The specified dimensions or file sizes will always match the latest official requirements.</li>
            <li>The Service will be uninterrupted, error-free, or virus-free.</li>
          </ul>

          <h2>7. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, <strong>Satyendra Singh Dhakad
            (MxPrime)</strong> and the operators of MxPrime Resizer shall not be liable for any
            direct, indirect, incidental, or consequential damages including but not limited to:
          </p>
          <ul>
            <li>Form rejections by exam portals due to non-compliant image specifications.</li>
            <li>Loss of opportunity, time, or application fees.</li>
            <li>Any data loss or corruption arising from use of the Service.</li>
          </ul>

          <h2>8. Intellectual Property</h2>
          <p>
            The source code, design, and brand assets of MxPrime Resizer are proprietary.
            Exam names (IBPS, SBI, UPSC, SSC, NTA, NEET, JEE, RRB, RBI, LIC) are trademarks
            of their respective organizations and are used solely for descriptive/reference purposes.
          </p>

          <h2>9. Modifications to Terms</h2>
          <p>
            We reserve the right to update these Terms at any time. Changes will be effective
            upon posting the updated Terms on this page with a revised "Last updated" date.
          </p>

          <h2>10. Governing Law</h2>
          <p>
            These Terms shall be governed by the laws of India. Any disputes shall be subject
            to the exclusive jurisdiction of courts in India.
          </p>

          <h2>11. Contact</h2>
          <p>
            For any questions about these Terms, contact the developer:{' '}
            <br />
            <strong>Satyendra Singh Dhakad (MxPrime)</strong>
            <br />
            <a href="mailto:thes8tyndrx@gmail.com">thes8tyndrx@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
