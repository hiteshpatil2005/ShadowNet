# 🌐 ShadowNet AI - Frontend Client Setup

This directory contains the complete React 19 and Vite 7 frontend application for the ShadowNet AI Attack Surface Management & Threat Intelligence platform.

---

## 🚦 Getting Started & Local Installation

To set up and run the frontend developer server locally, execute the following commands in your shell environment:

### 1. Prerequisites
Ensure you have Node.js (version 18 or higher) and npm installed:
```bash
node --version
npm --version
```

### 2. Install Project Dependencies
Navigate into the `client` directory and install all node packages:
```bash
cd client
npm install
```

### 3. Run Development Server
Boot up the local Vite server:
```bash
npm run dev
```
The terminal will mount on `http://localhost:5173`. Open this URL in your web browser to access the active command center.

### 4. Build Production Bundle
To compile a minimized, production-ready static bundle:
```bash
npm run build
```
The compiled files will be written to the `client/dist` directory, fully prepared for deployment.

---

## 🛠️ Frontend Stack Details

*   **React 19 & React DOM 19:** Utilizing modern hooks (`useMemo`, `useCallback`, `useState`, `useEffect`) and Central Context Providers.
*   **Vite 7:** High-speed development asset pipeline and build orchestrator.
*   **Tailwind CSS v4:** Driven by the new `@import "tailwindcss"` system and customized `@theme` directives.
*   **@xyflow/react (React Flow 12):** Interactive node mapping engine for network topologies.
*   **Recharts:** Interactive vector graphs mapped to cyber-dark aesthetics.
*   **Framer Motion:** Custom micro-animations and immersive scanline layouts.
*   **Lucide React:** Security-focused vector icon suites.

---

## 🎨 Theme & Styling System Configuration

All active style tokens are managed within **[`src/index.css`](file:///d:/ShadowNet_AI/client/src/index.css)** under the Tailwind CSS v4 `@theme` block:

```css
@theme {
  --color-cyber-black: #06090e;
  --color-cyber-dark: #0b0f17;
  --color-cyber-gray: #151c28;
  --color-cyber-light: #202b3c;
  --color-neon-blue: #00f0ff;
  --color-neon-purple: #bd00ff;
  --color-severity-critical: #ef4444;
  --color-severity-high: #f97316;
  --color-severity-medium: #3b82f6;
  --color-severity-low: #10b981;
  --color-cyber-text-primary: #f8fafc;
  --color-cyber-text-secondary: #94a3b8;
  
  --font-mono: "Fira Code", "Courier New", Courier, monospace;
}
```

### Integrated Global Overrides:
1.  **`.cyber-grid`:** Generates a custom cyan-tinted digital backdrop grid (`background-image: linear-gradient...`).
2.  **`.cyber-scanlines`:** Overlays a pulsing CRT scanline layer across security terminals.
3.  **`.glow-blue` & `.glow-critical`:** Dynamic shadow/glow configurations mapping ambient cyan or red indicators.
4.  **`:: -webkit-scrollbar`:** Sleek customized scrollbar thumbs that highlight neon cyan on hover.
