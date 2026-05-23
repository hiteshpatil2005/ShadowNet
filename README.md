# 🌐 ShadowNet AI
### Advanced Attack Surface Management & Threat Intelligence Platform

ShadowNet AI is an advanced cybersecurity intelligence platform designed for security operation centers (SOC) and enterprise risk analysts. The platform aggregates exposed digital footprint data, identifies active server vulnerabilities, matches compromised credentials, maps network relationships, simulates adversary path takeovers, and generates report assessments through an immersive, high-tech interface.

---

## 💎 Project Objectives & Core Vision
*   **Intuitive Threat Mapping:** Empower security analysts to explore exposed digital assets and map dependencies across complex environments.
*   **Attacker Behavior Simulation:** Forecast risk pathways and trace lateral adversary movements before compromise occurs.
*   **Digital Footprint Tracking:** Monitor data leakages, exposed AWS S3 / GCP buckets, and leaked corporate credentials in real-time.
*   **Immutable Analyst Collaboration:** Support real-time notepad documentation, custom templates, and direct PDF/HTML reporting tools.

---

## 🚀 The Nine Pillars (Functional Views)

### 1. 📊 Executive Command Dashboard
*   **Postures & Threat Dial:** An interactive speedometer dial tracking real-time risk index levels (rated High Risk at `78/100`).
*   **Key Exposure Alerts Feed:** Prioritized streams detailing recently crawled critical and high-severity threat vectors.
*   **Vulnerability Radar Chart:** Interactive Recharts distribution analyzing exposures across categories (Port Vulnerabilities, Cloud Exposures, Credential Leaks, API disclosure).
*   **Historical Risk Indices:** 30-day area chart tracking monitored asset coverage against threat score fluctuations.

### 2. 🔍 Digital Footprint Explorer
*   **Exposed Assets Registry:** Unified database representing subdomains, server IPs, risk ratings, and crawl discovery methods.
*   **Interactive Filters:** Quick tabs to isolate assets by cloud service provider (AWS, GCP, Self-Hosted) or network crawler source (DNS AXFR, Transparency logs, Active Scans).
*   **Profile pivots:** Custom hooks allowing analysts to pivot seamlessly into deep records configurations.

### 3. ⛓️ Exposure Correlation Matrix
*   **Threat Vector Cross-Reference:** Tabular mapping linking exposed ports directly with credential breach details and unpatched CVE indexes (e.g., CVE-2023-46805, CVE-2024-23897).
*   **Takeover Threat Paths:** Logical summaries highlighting critical structural vulnerabilities like Active Directory Dominance paths.

### 4. 🎯 Attack Path Simulator
*   **Simulated Adversary Walkthroughs:** Step-by-step visual map following real-world MITRE ATT&CK techniques (Reconnaissance, initial access, lateral movement, Kerberoasting, and final ransomware exfiltration).
*   **Adversary Action Terminal:** Micro-logs displaying predicted breach confidence levels and simulated script behaviors.
*   **Mitigation Checklists:** Prioritized operational lists allowing analysts to mark tasks as Completed or In Progress to track remediation status.

### 5. 🕸️ Infrastructure Intelligence Graph Map
*   **Force-Directed Network Topology:** Immersive, draggable node-link layout powered by **React Flow 12 (`@xyflow/react`)**.
*   **Draggable Node Classifications:** Custom interactive node components for primary Domains, Subdomains, Cloud Storage buckets, credentials, and network services.
*   **Custom Edge Connections:** Glowing animated connectors matching severity vectors (e.g., critical path flows represented by pulsing red lines).

### 6. 🚨 Continuous Monitoring Console
*   **Keyword Alert Manager:** Form interface allowing analysts to enroll custom monitoring keywords for domains, key emails, or bucket namespaces.
*   **Discovery Scan Stream:** Ongoing real-time terminal output displaying crawler events, API detections, and deep-web parses.

### 7. 💻 Deep Asset Profile Terminal
*   **Domain Zone Files:** Full table breakdown of DNS records (A, MX, NS, TXT, SOA).
*   **Port & Service Banner Registry:** Detail maps showing active host connection statuses, server banners (e.g., `Apache-Coyote/1.1`, `Tomcat/8.5.31`), and SSL validation periods.
*   **State Dumps:** Raw JSON state inspector showing compiled footprint data directly.

### 8. 📝 Report Builder & Analyst Notepad
*   **Compliance & Technical Templates:** Automated drafting layouts matching SOC 2, ISO 27001, and C-Level Executive summaries.
*   **Interactive Analyst Scratchpad:** Active textarea workspace for jotting down notes while navigating between dashboards.
*   **Multiformat Exporter:** Utilities to print or download reports in clean PDF or HTML files.

### 9. 🔒 Authorization & Enrollment Portal
*   **Analyst Login Gateway:** Secure portal checking certificates and enforcing encrypted sessions.
*   **Analyst Terminal Enrollment (New User Registration):** A multi-step registration interface allowing new users to select their SOC role and generate a unique cryptographic profile.
*   **Mock Biometrics Verification:** Interactive scan engine displaying a fingerprint scanning layout with rolling cryptographic progress bars.

---

## 🛠️ Technology Stack & Architectures

| Core Stack | Framework | Key Implementation Roles |
| :--- | :--- | :--- |
| **React 19** | Frontend Core | Handles active states, search memoizations, and secure context providers. |
| **Vite 7** | Development Env | Drives instant Hot Module Replacement (HMR) and optimized compilations. |
| **Tailwind CSS v4** | Layout & Themes | Tailors custom modern cyber-dark styles and visual properties. |
| **@xyflow/react** | Network Graphs | Powers custom nodes and force-directed draggable layouts. |
| **Recharts** | Data Charting | Renders customizable vector graphs matched to dark themes. |
| **Framer Motion** | Motion Styling | Manages smooth interface transitions, scanner cycles, and glow overlays. |

---

## 📂 Repository Directory Layout

```text
ShadowNet_AI/
├── client/                     # Monolithic React + Vite frontend client
│   ├── public/                 # Static vector assets
│   └── src/
│       ├── components/         # Persistent navigation layout headers & sidebars
│       ├── context/            # Centralized AppContext.jsx global state provider
│       ├── data/               # Mock datasets representing CVE correlations & subdomains
│       ├── pages/              # Nine independent interactive platform pages
│       └── index.css           # Tailwind v4 configuration, scanlines, and glow layers
└── README.md                   # Core project details and functional vision (This File)
```

---

## 🚦 Frontend Development Setup
For developer prerequisites, dependency installation commands, and steps to launch or build the frontend terminal, please reference the **[Client Setup Documentation](file:///d:/ShadowNet_AI/client/README.md)**.
