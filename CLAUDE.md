# CLAUDE.md — MxPrime Resizer Guidelines

This document serves as a developer guide for building, extending, and styling the client-side document resizer.

---

## 🛠 Command Reference

*   **Install Dependencies**: `npm install`
*   **Run Development Server**: `npm run dev`
*   **Production Build**: `npm run build`
*   **Preview Build Output**: `npm run preview`

---

## 💾 Data Layer Schema (`src/data/exam-presets.json`)

The application's list of supported exams and requirements is entirely static-driven via `exam-presets.json`. Adding or updating an exam requires no React code changes.

### Presets Schema:
```json
{
  "exams": {
    "exam-unique-key": {
      "id": "exam-unique-key",
      "name": "Human Readable Tag",
      "fullName": "Full Exam Recruiting Body Title",
      "category": "IBPS | SBI | RBI | OTHER",
      "docs": {
        "photo": { "width": 200, "height": 230, "minKB": 20, "maxKB": 50, "format": "image/jpeg", "aspectRatio": 0.8695 },
        "signature": { "width": 140, "height": 60, "minKB": 10, "maxKB": 20, "format": "image/jpeg", "aspectRatio": 2.3333 },
        "thumb": { "width": 240, "height": 240, "minKB": 20, "maxKB": 50, "format": "image/jpeg", "aspectRatio": 1.0 },
        "declaration": { "width": 800, "height": 400, "minKB": 50, "maxKB": 100, "format": "image/jpeg", "aspectRatio": 2.0 }
      },
      "declarationText": "Exact text candidate must copy down in their own handwriting..."
    }
  }
}
```

### How to Add a New Exam:
1. Open `src/data/exam-presets.json`.
2. Add a new object key inside the `"exams"` dictionary matching the schema above.
3. Save the file. The UI tabs, document type requirements, and declaration template copy-paster will automatically update.

---

## ⚡ Compression & Padding Engine (`useCompressToTarget.js`)

Government portal upload fields require strict compliance on both high-end limits (avoiding heavy files) and low-end limits (retaining legible detail).

1. **Binary Search Compression**:
   The engine performs up to 8 iterations of binary-search on the JPEG quality parameter ($q \in [0.05, 1.00]$):
   * If quality $q$ yields a file size exceeding the maximum limit (`maxKB`), the search range drops to the lower half.
   * If size is within bounds, it registers the blob and attempts to raise quality.
2. **Invisible JPEG COM Padding**:
   Simple/monochromatic drawings (like signatures or black pen handwriting) can naturally compress to $\approx 4\text{ KB}$ even at $q=1.0$, which fails the $10\text{ KB}$ portal minimum.
   * The hook appends a safe JPEG Comment (`COM`, marker `0xFFFE`) structure filled with dummy padding bytes right before the EOI (`0xFFD9`) marker.
   * The JPEG standard ignores any content inside the `COM` segment during decoding, preserving visual quality while bringing file size strictly within the compliant range.

---

## 🎨 Design System & SaaS Styling Tokens

Replicating the off-black and white minimalist SaaS design patterns (TinyFish.ai):
*   **Canvas Background**: Off-white `#FAFAF9` with a subtle grid pattern overlay (`background-size: 20px 20px`).
*   **Headline Typography**: Tight letter-tracking (`-0.04em`), Space Grotesk font family.
*   **Accent Color**: Single energetic orange (`#FF6A00`), applied to a maximum of 2 words in headlines or active tabs.
*   **Eyebrow Tags**: Monospace text inside a thin-bordered black border box (`Space Mono`).
*   **Monospace Row**: Centered stats row utilizing dot separators (`·`).
*   **Buttons**: Sharp corners (border-radius $\le 2\text{px}$), solid black `#1C1917` for primary actions, thin border outline for secondary actions.
*   **Trademark Safety**: Do **NOT** use official IBPS/SBI/RBI/RRB graphic logos. Rely solely on clean text chips.
