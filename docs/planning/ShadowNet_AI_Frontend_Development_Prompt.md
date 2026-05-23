# ShadowNet AI - Frontend Development Prompt

## Project Overview
ShadowNet AI is an advanced cybersecurity intelligence platform designed to analyze organizations' publicly exposed digital footprints, correlate threat intelligence, simulate attacker behavior, and generate intelligent attack path predictions. The frontend must deliver a powerful, intuitive interface for security professionals to visualize complex threat data, infrastructure relationships, and attack scenarios.

---

## Frontend Objectives
1. Create an intuitive dashboard for security analysts to explore exposed digital assets
2. Visualize complex infrastructure relationships and threat correlations
3. Display AI-generated attack path simulations in an interactive, understandable format
4. Generate and present executive-level security narratives and risk assessments
5. Provide real-time monitoring and alerting capabilities for continuous exposure tracking
6. Enable investigation pivoting through an interactive infrastructure intelligence graph

---

## Technology Stack
- **Framework**: React.js with Vite (build tool)
- **Styling**: Tailwind CSS
- **Graph Visualization**: React Flow (for infrastructure intelligence graph visualization)
- **Animation Library**: Framer Motion
- **State Management**: (As per team preference - Context API, Redux, or Zustand)
- **HTTP Client**: Axios or Fetch API
- **Additional Libraries**: (React Router for navigation, Chart.js or Recharts for data visualization, etc.)

---

## Core UI Pages & Components

### 1. **Dashboard / Home Page**
**Purpose**: Main entry point providing an overview of the organization's security posture
**Key Elements**:
- Quick stats display (Total Exposed Assets, Critical Vulnerabilities, Active Threats, Monitoring Coverage)
- Recent exposure alerts with severity indicators
- Infrastructure change timeline (visual graph of exposure evolution)
- Quick access buttons to main modules (Analysis, Monitoring, Reports)
- Key risk indicators and trends
- Search/filter options for rapid navigation

**Design Considerations**:
- Professional, cybersecurity-focused aesthetic
- Clear visual hierarchy with threat severity color coding (Critical, High, Medium, Low)
- Dark theme with accent colors for alert severity
- Responsive layout for desktop and tablet viewing
- Performance optimized for rendering multiple data points

### 2. **Digital Footprint Analysis Page**
**Purpose**: Display comprehensive results from the Digital Footprint Collection Engine
**Key Elements**:
- Subdomain listing with discovery source and exposure risk
- Discovered services, APIs, and open ports with detailed metadata
- Leaked credentials detection results with exposure context
- Cloud exposure findings (S3 buckets, databases, etc.)
- Filter/search capabilities by asset type, risk level, or discovery source
- Expandable cards showing detailed asset information
- Export options for findings

**Design Considerations**:
- Tabular data with sorting, filtering, and pagination
- Visual indicators for asset types (API icon, Cloud icon, Credential icon, etc.)
- Drill-down capability to detailed asset profiles
- Timeline view for when assets were discovered/exposed

### 3. **Exposure Correlation Engine Results Page**
**Purpose**: Display correlated threat data and risky asset combinations
**Key Elements**:
- Correlation matrix showing relationships between exposed credentials and services
- Risk scoring visualization (likely showing high-risk correlations)
- Suspicious infrastructure relationship mapping
- Attack surface combination warnings
- Visual highlighting of dangerous patterns (e.g., admin credentials + internet-facing service)
- Correlation strength/confidence indicators

**Design Considerations**:
- Heat maps or color-coded correlation matrices
- Network-style visualization for relationship mapping
- Severity-based highlighting for dangerous correlations
- Detailed explainers for why correlations are risky

### 4. **AI Adversary Reasoning & Attack Path Simulation Page**
**Purpose**: Core intelligence module showing AI-generated attack simulations and threat narratives
**Key Sub-Sections**:

#### 4a. **Attack Path Simulation Results**
- Multi-stage attack flow visualization (reconnaissance → exploitation → lateral movement → privilege escalation)
- Step-by-step attack chain breakdown with probability/likelihood metrics
- Simulated attack scenarios (ransomware, credential abuse, insider threat paths)
- Visual workflow showing attack progression
- Annotations explaining attacker decision logic at each stage
- Success probability or impact assessment for each path

#### 4b. **Threat Persona Prediction**
- Predicted attacker categories (APT groups, Cybercriminals, Insiders, etc.)
- Ransom targeting analysis for organizations
- Phishing infrastructure identification
- Threat actor behavior patterns and motivations
- Confidence scores for predictions

#### 4c. **Risk Narrative & Recommendations**
- Executive-level security narrative in readable format
- Real-world impact explanations
- Prioritized remediation recommendations
- Risk context and business implications
- Summary of security posture relative to exposure

**Design Considerations**:
- Interactive flowchart/diagram for attack paths (using Framer Motion for animations)
- Step indicators and progression visualization
- Color-coded severity and confidence metrics
- Readable narrative blocks with professional formatting
- Expandable sections for detailed technical explanations

### 5. **Infrastructure Intelligence Graph Page**
**Purpose**: Interactive visualization of all infrastructure relationships and pivoting
**Key Elements**:
- Node-link graph visualization showing IPs, domains, services, and certificates
- Interactive node exploration (click to expand relationships)
- Visual differentiation between node types (IP, Domain, Certificate, Service)
- Edge labels showing relationship types (hosted_on, resolves_to, valid_for, etc.)
- Search and filter for specific infrastructure components
- Zoom and pan capabilities
- Selection and multi-select for batch operations
- Investigation pivoting (click a node to see related assets)
- Layout algorithms for readability (force-directed, hierarchical, etc.)

**Design Considerations**:
- Use React Flow library for graph rendering
- Custom node designs with icons representing asset type
- Color coding for risk levels or asset categories
- Tooltip information on hover
- Performance optimization for large graphs (virtualization)
- Animation when nodes are added/removed

### 6. **Continuous Exposure Monitoring Page**
**Purpose**: Real-time monitoring dashboard for exposure evolution
**Key Elements**:
- Real-time alert feed with timestamps and severity
- Infrastructure change detection alerts (new exposed assets, deleted assets, certificate updates)
- Credential leak detection notifications
- Historical exposure timeline (when assets were first/last seen)
- Monitoring configuration and alert rules customization
- Notification preferences and integration options
- Exposure metrics over time (graph showing trend)

**Design Considerations**:
- Live update capability (WebSocket or polling)
- Alert notification styling with clear severity differentiation
- Timeline visualization for exposure history
- Quick actions to acknowledge or investigate alerts

### 7. **Detailed Asset Profile Pages**
**Purpose**: Comprehensive detail view for individual exposed assets
**Key Elements**:
- Complete asset metadata (IP, domain, certificate info, services, ports)
- Exposure history and timeline
- Related assets and correlations
- Associated credentials or leaked data
- Risk assessment and recommendations
- Investigation notes and context
- Historical changes and evolution

**Design Considerations**:
- Organized tabbed or accordion layout
- Visual connection indicators to other assets
- Timeline view of changes
- Export/sharing capabilities

### 8. **Reporting & Export Page**
**Purpose**: Generate and export security reports for stakeholders
**Key Elements**:
- Report template selection (Executive Summary, Technical Analysis, Detailed Findings)
- Customizable report sections and metrics
- Data visualization options for included charts/graphs
- Schedule automated report generation
- Export formats (PDF, CSV, JSON)
- Report history and versioning
- Sharing and access controls

**Design Considerations**:
- Template preview functionality
- Drag-and-drop section customization
- WYSIWYG report builder
- Export progress and status indicators

---

## Navigation & Layout Structure

### Primary Navigation
- Implement a persistent sidebar or top navigation with links to all major modules
- Active page highlighting
- User profile/logout in header or sidebar
- Search functionality accessible from all pages (global search)
- Theme toggle (dark/light mode) if applicable

### Responsive Design
- Desktop-first design approach
- Tablet-optimized layouts (reduce column count, adjust spacing)
- Mobile support where feasible (or explicitly scope as desktop-only)
- Breakpoints: 1920px (desktop), 1280px (tablet), 768px (mobile)

---

## Design & Aesthetic Requirements

### Visual Design
- **Color Scheme**: Dark cybersecurity theme with strategic accent colors
  - Primary Background: Dark charcoal/black
  - Text: Light gray/white with hierarchy
  - Accent Colors: Red/Orange (Critical), Yellow (High), Blue (Medium), Green (Low/Info)
  - Highlight Color: Cyan or Electric Blue for interactive elements
  
- **Typography**: Professional, modern fonts
  - Display/Headers: Use distinctive, modern font choice
  - Body Text: Readable sans-serif for accessibility
  - Monospace: For IP addresses, domains, and technical data
  
- **Icons**: 
  - Use a consistent icon library (Lucide, Feather, or custom SVG)
  - Represent asset types visually (API, Cloud, Credential, etc.)
  - Use in alerts, buttons, and data tables

- **Visual Effects**:
  - Subtle animations for page transitions (fade, slide)
  - Hover states on interactive elements (color change, elevation)
  - Loading states and skeleton screens for data fetching
  - Toast/notification animations for alerts
  - Smooth scrolling and transitions

### Information Architecture
- Logical grouping of related features
- Consistent naming across pages
- Clear visual distinction between sections
- Breadcrumb navigation or clear page titles

---

## Data Visualization Requirements

### Chart/Graph Types Needed
1. **Timeline Graphs**: Exposure evolution over time (line, area charts)
2. **Correlation Matrices**: Heatmaps showing asset relationships
3. **Attack Flow Diagrams**: Step-by-step attack path visualization
4. **Network Graphs**: Infrastructure relationship visualization (React Flow)
5. **Metrics Dashboards**: KPI cards, gauge charts, progress indicators
6. **Bar/Pie Charts**: Asset distribution by type, severity distribution

**Libraries**: Recharts, Chart.js, or React-based charting solutions

---

## Interactive Features & User Actions

### Search & Filter
- Global search across all data (search by IP, domain, asset name, etc.)
- Advanced filter options per page (by risk level, asset type, date range, etc.)
- Saved filters/views for quick access
- Search result highlighting

### Data Tables
- Sorting by multiple columns
- Column customization (show/hide columns)
- Pagination with variable row count
- Inline editing where applicable (investigation notes, etc.)
- Multi-select with batch actions (export, tag, etc.)

### Interactive Workflows
- Wizard-style configuration for monitoring rules
- Asset investigation pivoting (click asset → see related assets)
- Recommendation action buttons (remediate, escalate, investigate)
- Note/comment functionality for collaborative investigation

---

## Performance & Optimization

### Requirements
- Page load time < 3 seconds for dashboard
- Smooth scrolling and interactions (60 FPS target)
- Optimized image/icon loading
- Lazy loading for list/table data (infinite scroll or pagination)
- Graph rendering optimization for large infrastructure datasets (1000+ nodes)
- Debounced search and filter operations

### Best Practices
- Code splitting for lazy-loaded pages
- Memoization for expensive computations
- Virtual scrolling for large lists
- Caching strategy for API responses
- Minification and bundling optimization

---

## Security & Authentication UI

### Authentication
- Login/registration page (simple, professional)
- Session management (logout, session timeout)
- Role-based UI adjustments if multi-user features exist

### Data Sensitivity
- Credential display masks sensitive data (show last 4 characters, etc.)
- API key management for integrations
- Audit logs for user actions (optional but recommended)

---

## Accessibility Requirements
- WCAG 2.1 AA compliance where feasible
- Keyboard navigation support
- Screen reader friendly (semantic HTML)
- Color contrast ratios meet standards (not relying solely on color for meaning)
- Alt text for images
- Focus indicators for interactive elements

---

## Error Handling & Edge Cases

### UI Elements for Error States
- Clear error messages with actionable guidance
- Retry buttons for failed requests
- Graceful degradation when data is unavailable
- Loading states and progress indicators
- Empty states with helpful guidance when no data exists

---

## Integration Points (Backend API)

### Expected API Endpoints (for Frontend to consume)
- `GET /api/dashboard/overview` - Dashboard metrics
- `GET /api/assets/footprint` - Digital footprint results
- `GET /api/exposure/correlations` - Correlation engine results
- `GET /api/attack-paths/simulate` - Attack simulation results
- `GET /api/threat-personas/predict` - Threat persona predictions
- `GET /api/infrastructure/graph` - Graph visualization data
- `GET /api/alerts/feed` - Real-time alerts
- `GET /api/assets/:id` - Detailed asset profile
- `POST /api/reports/generate` - Report generation
- `GET /api/monitoring/config` - Monitoring configuration

**Note**: Frontend developer should coordinate with backend developer on exact endpoint specifications, response formats, and authentication headers.

---

## Development Workflow & Deliverables

### Phase 1: Setup & Core Layout
- Project initialization with Vite and Tailwind CSS
- Routing structure (React Router)
- Layout component (sidebar/header/content area)
- Basic page templates

### Phase 2: Dashboard & Overview Pages
- Dashboard implementation
- Digital Footprint Analysis page
- Exposure Correlation page
- Basic styling and responsive design

### Phase 3: Advanced Visualization Pages
- Attack Path Simulation page with interactive flowchart
- Infrastructure Intelligence Graph with React Flow
- Threat Persona Prediction display
- Risk Narrative and Recommendations section

### Phase 4: Monitoring & Reporting
- Continuous Exposure Monitoring page
- Real-time alert feed implementation
- Reporting & Export page
- Timeline visualizations

### Phase 5: Polish & Optimization
- Performance optimization
- Animation refinement
- Responsive design testing
- Accessibility audit and fixes
- Error handling and loading states
- Cross-browser testing

---

## Component Architecture Recommendations

### Suggested Component Structure
- **Layout Components**: Sidebar, Header, MainLayout
- **Page Components**: Dashboard, Footprint, Correlations, AttackPaths, Graph, Monitoring, Reports
- **Shared Components**: Card, Table, Modal, Toast, Alert, Badge, Button
- **Chart Components**: LineChart, BarChart, HeatMap, FlowDiagram, NetworkGraph
- **Form Components**: SearchBar, FilterPanel, Modal Forms

---

## Styling Guidelines

### Tailwind CSS Setup
- Custom theme configuration for cybersecurity aesthetic
- CSS custom properties for dynamic theming (if dark/light mode needed)
- Consistent spacing and sizing scale
- Responsive utility-first approach
- Custom component classes in globals CSS if needed

### Color Tokens
- Define semantic color names (e.g., `danger`, `warning`, `success`, `info`)
- Maintain consistent opacity/transparency usage
- Ensure sufficient contrast ratios

---

## Testing & Quality Assurance

### Frontend QA Checklist
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Responsive design on target breakpoints
- Keyboard navigation and accessibility
- Error state handling
- Loading state visualization
- Real-time update functionality (if applicable)
- Graph rendering performance with large datasets
- API integration correctness

---

## Documentation Requirements

### Code Documentation
- Component prop documentation (TypeScript interfaces preferred)
- Complex logic explanation (especially for graph and attack path visualization)
- Setup instructions for development environment
- Build and deployment instructions

### User Documentation
- UI tooltips and help text for complex features
- Feature explanation sections (or separate docs)
- API response mapping documentation

---

## Deployment Considerations

### Build & Deployment
- Optimize build output (bundle size analysis)
- Static asset caching strategy
- Environment variable configuration (API base URL, etc.)
- Build-time optimization (tree-shaking, minification)

---

## Success Criteria

The frontend will be considered complete when:
1. All major pages and modules are implemented and functional
2. Data flows correctly from backend API to UI display
3. Interactive features (search, filter, graph navigation) work smoothly
4. Performance targets are met (< 3s load time, 60 FPS interactions)
5. Responsive design works on target breakpoints
6. Accessibility standards are met
7. Error handling and edge cases are gracefully managed
8. Code is well-structured, documented, and maintainable
9. Visual design is cohesive, professional, and cybersecurity-appropriate
10. All features match backend data structure and API contracts

---

## Notes & Recommendations

1. **Coordinate with Backend**: Establish clear API contracts early, including request/response formats and authentication tokens
2. **Mock Data**: Create mock data for development before backend is ready
3. **Performance Monitoring**: Implement performance tracking (Web Vitals) to monitor real user experience
4. **Accessibility**: Test with screen readers and keyboard navigation regularly
5. **Version Control**: Use Git with clear commit messages and branch strategy
6. **Component Reusability**: Design components to be reusable across pages
7. **State Management**: Plan state management strategy (global state, local state, server state)
8. **Testing**: Consider unit tests for components and integration tests for API calls
