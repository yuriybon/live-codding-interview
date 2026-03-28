# UI Visual Mapping: Prototype to Product

**Document ID**: UI-MAPPING-001
**Created**: 2026-03-28
**Status**: Draft
**Purpose**: Map prototype visual elements to current product implementation for Phase 11 visual refresh

## Table of Contents

1. [Visual Design System Elements](#visual-design-system-elements)
2. [Component-by-Component Mapping](#component-by-component-mapping)
3. [Implementation Targets](#implementation-targets)

---

## Visual Design System Elements

### Color Palette

| Element | Current Implementation | Target Component Files |
|---------|----------------------|------------------------|
| **Primary Background** | `bg-gray-900 to-gray-800` gradient | All pages |
| **Card Background** | `bg-gray-800` | LandingPage.tsx, InterviewRoom.tsx, SessionSummary.tsx |
| **Primary Accent** | Blue (`blue-600`, `blue-400`, `blue-300`) | Buttons, badges, status indicators |
| **Success State** | Green (`green-400`, `green-600`) | Active screen share, positive feedback |
| **Warning/Active State** | Red (`red-600`) | Active audio recording, alerts |
| **Secondary Accent** | Purple (various shades) | Alternative status indicators |
| **Text Primary** | `text-white` | Headers, primary content |
| **Text Secondary** | `text-gray-300`, `text-gray-400` | Descriptions, metadata |
| **Text Tertiary** | `text-gray-500+` | Disabled states, low-emphasis content |
| **Borders** | `border-gray-700` | Card dividers, input fields |

**Files**: `/frontend/src/index.css`, `/frontend/tailwind.config.js`

### Typography

| Element | Current Implementation | Usage Context |
|---------|----------------------|---------------|
| **Hero Titles** | `text-4xl`, `text-5xl`, `font-bold` | Landing page hero section |
| **Section Headers** | `text-2xl`, `text-3xl`, `font-bold` | Page section titles |
| **Card Titles** | `text-lg`, `text-xl`, `font-semibold` | Card headers, panel titles |
| **Body Text** | `text-base`, `text-sm` | Descriptions, content |
| **Metadata/Labels** | `text-xs`, `text-sm`, `text-gray-400` | Timestamps, helper text |
| **Font Stack** | `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto` | All UI text |
| **Code Font** | `Fira Code`, `Consolas`, `Monaco` monospace | Code editor |

**Files**: `/frontend/src/index.css`

### Spacing Scale

| Element | Current Values | Pattern |
|---------|---------------|---------|
| **Card Padding** | `p-4`, `p-6`, `p-8` | Varies by card importance |
| **Section Gaps** | `gap-4`, `gap-6`, `gap-8` | Consistent vertical rhythm |
| **Page Container** | `max-w-7xl mx-auto px-4` | Centered responsive container |
| **Grid Gaps** | `gap-6`, `gap-8` | Feature cards, metrics |
| **Rounded Corners** | `rounded-lg`, `rounded-xl`, `rounded-2xl` | Progressive emphasis |

**Pattern**: Increments of 4px (Tailwind's spacing scale)

### Card Treatments

| Card Type | Current Styling | Location |
|-----------|----------------|----------|
| **Primary Cards** | `bg-gray-800 rounded-xl p-6 shadow-xl` | Auth card, session start, performance card |
| **Secondary Cards** | `bg-gray-800 rounded-lg p-4` | Feature cards, metrics, sidebar panels |
| **Status Cards** | `bg-{color}-900/30 text-{color}-300 rounded-lg p-3` | Badges, status indicators |
| **Interactive Cards** | Hover: `hover:bg-gray-700 transition-colors` | Clickable feature cards |
| **Elevated Cards** | `shadow-2xl backdrop-blur-md` | Modal overlays, nav bar |

**Pattern**: Dark glass-morphism aesthetic with semi-transparent layering

### Status Indicators

| Status Type | Current Pattern | Component |
|-------------|----------------|-----------|
| **AI Speaking** | Blue badge `bg-blue-900/30 text-blue-300` | AiVisualizer.tsx |
| **Audio Active** | Red button `bg-red-600 hover:bg-red-700` | InterviewRoom.tsx:123 |
| **Screen Share Active** | Green button `bg-green-600 hover:bg-green-700` | InterviewRoom.tsx:134 |
| **Timer** | Clock icon + text `text-gray-300` | InterviewRoom.tsx:115 |
| **Connection Status** | Badge with pulse animation | Custom CSS animation |
| **Performance Score** | Large number + progress bars | SessionSummary.tsx:45 |

**Files**: `/frontend/src/components/AiVisualizer.tsx`, `/frontend/src/pages/InterviewRoom.tsx`

### Button Hierarchy

| Button Type | Current Styling | Usage |
|-------------|----------------|-------|
| **Primary CTA** | `bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg` | "Start Interview", "Sign In" |
| **Secondary Action** | `bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg` | "Request Hint", "View Details" |
| **Destructive** | `bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg` | "End Interview" |
| **Toggle (Active)** | `bg-{color}-600 text-white` | Audio, screen share controls |
| **Toggle (Inactive)** | `bg-gray-700 text-gray-300` | Disabled controls |
| **Icon Button** | Icon + text, horizontal flex layout | All control buttons |

**Pattern**: lucide-react icons paired with text labels, consistent padding, rounded corners

---

## Component-by-Component Mapping

### 1. Landing Page (`/frontend/src/pages/LandingPage.tsx`)

#### Current Structure
```
NavBar (top)
Container (max-w-7xl)
  └─ Hero Section
      ├─ Title (text-5xl font-bold)
      ├─ Description (text-xl text-gray-300)
      └─ Badge (bg-blue-900/30 text-blue-300)
  └─ Auth Card (bg-gray-800 rounded-xl shadow-xl)
  └─ Session Start Card (bg-gray-800 rounded-xl shadow-xl)
  └─ Feature Cards Grid (3-column, md:grid-cols-3)
      ├─ Real-time Coaching
      ├─ Voice Recognition
      └─ Comprehensive Assessment
```

#### Prototype Mapping Targets

| Prototype Element | Current Component | Target File:Line |
|-------------------|------------------|------------------|
| **Hero Title** | `<h1>` with gradient text | LandingPage.tsx:30 |
| **Hero Subtitle** | `<p>` below title | LandingPage.tsx:35 |
| **Badge Treatment** | Pill with semi-transparent bg | LandingPage.tsx:40 |
| **Auth CTA** | Google Sign-In button | LandingPage.tsx:50 |
| **Session Start CTA** | "Start Interview" button | LandingPage.tsx:70 |
| **Feature Card 1** | Real-time Coaching | LandingPage.tsx:85 |
| **Feature Card 2** | Voice Recognition | LandingPage.tsx:95 |
| **Feature Card 3** | Assessment | LandingPage.tsx:105 |
| **Card Icons** | lucide-react icons | LandingPage.tsx:86,96,106 |
| **Color Palette** | Blue accents on dark bg | index.css, tailwind.config.js |

**Refresh Scope (TASK-11.2)**:
- Hero hierarchy adjustment
- CTA button treatment refinement
- Feature card spacing and color consistency
- Preserve existing auth/session-start behavior

---

### 2. Interview Room (`/frontend/src/pages/InterviewRoom.tsx`)

#### Current Structure
```
NavBar (top)
Container (full-width)
  └─ Controls Header (flex horizontal)
      ├─ Timer
      ├─ Audio Toggle
      ├─ Screen Share Toggle
      ├─ Request Hint
      └─ End Interview
  └─ Main Grid (lg:grid-cols-3)
      ├─ Code Editor (Monaco, lg:col-span-2)
      └─ Sidebar (lg:col-span-1)
          ├─ AI Visualizer Panel
          ├─ Coach Feedback Panel
          ├─ Session Stats Panel
          ├─ Screen Share Preview Panel
          └─ Transcript Panel
```

#### Prototype Mapping Targets

| Prototype Element | Current Component | Target File:Line |
|-------------------|------------------|------------------|
| **AI Speaking Card** | AiVisualizer component | InterviewRoom.tsx:165, AiVisualizer.tsx:15 |
| **Status Orb** | Glowing circle with animation | AiVisualizer.tsx:25 |
| **Waveform Bars** | Animated height bars | AiVisualizer.tsx:35 |
| **Screen Share Preview** | Video preview panel | InterviewRoom.tsx:200 |
| **Transcript Panel** | Speech history panel | InterviewRoom.tsx:210 |
| **Control Buttons** | Audio, screen share, hint, end | InterviewRoom.tsx:115-145 |
| **Code Editor** | Monaco dark theme | InterviewRoom.tsx:180 |
| **Timer Display** | Clock icon + formatted time | InterviewRoom.tsx:115 |
| **Feedback Panel** | Coach messages list | InterviewRoom.tsx:175 |
| **Stats Panel** | Metrics display | InterviewRoom.tsx:190 |

**Refresh Scope (TASK-11.3)**:
- AI speaking status card visual enhancement
- Screen-share preview presentation polish
- Transcript panel structure refinement
- Modernized control button emphasis

---

### 3. Session Summary (`/frontend/src/pages/SessionSummary.tsx`)

#### Current Structure
```
NavBar (top)
Container (max-w-7xl)
  └─ Header (title)
  └─ Performance Card (bg-gray-800 rounded-xl)
      ├─ Overall Score (large text)
      └─ Progress Bars (communication, technical)
  └─ AI Assessment Card
      ├─ Heading
      └─ Whitespace-preserved feedback
  └─ Metrics Grid (grid-cols-2 md:grid-cols-4)
      ├─ Minutes
      ├─ Lines Written
      ├─ Hints
      └─ Feedback Count
  └─ Feedback History
      └─ Feedback items list
  └─ CTA (Start Another Interview)
```

#### Prototype Mapping Targets

| Prototype Element | Current Component | Target File:Line |
|-------------------|------------------|------------------|
| **Performance Card** | Overall score display | SessionSummary.tsx:45 |
| **Large Score Number** | `text-6xl font-bold` | SessionSummary.tsx:50 |
| **Progress Bars** | Horizontal bars with fill % | SessionSummary.tsx:60 |
| **Assessment Card** | AI feedback text | SessionSummary.tsx:75 |
| **Metrics Grid** | 4-column stats | SessionSummary.tsx:90 |
| **Metric Card** | Icon + label + value | SessionSummary.tsx:95 |
| **Feedback History** | List of trigger events | SessionSummary.tsx:120 |
| **CTA Button** | "Start Another Interview" | SessionSummary.tsx:140 |
| **Section Spacing** | Vertical gaps between cards | SessionSummary.tsx:35 |

**Refresh Scope (TASK-11.4)**:
- Layout rhythm optimization
- Card hierarchy and emphasis
- Section readability improvements

---

### 4. Shared Components

#### NavBar (`/frontend/src/components/NavBar.tsx`)

| Element | Current Pattern | Target |
|---------|----------------|--------|
| **Container** | `backdrop-blur-md bg-gray-900/95` | NavBar.tsx:15 |
| **Logo/Brand** | Text or icon (left) | NavBar.tsx:20 |
| **User Pill** | Avatar + name (right) | NavBar.tsx:25 |
| **Logout Button** | Secondary button | NavBar.tsx:30 |

#### AiVisualizer (`/frontend/src/components/AiVisualizer.tsx`)

| Element | Current Pattern | Target |
|---------|----------------|--------|
| **Status Orb** | Gradient circle with glow | AiVisualizer.tsx:25 |
| **Waveform Bars** | Flex row of animated divs | AiVisualizer.tsx:35 |
| **Status Label** | Text below orb | AiVisualizer.tsx:45 |
| **Container Card** | `bg-gray-800 rounded-lg p-4` | AiVisualizer.tsx:15 |

---

## Implementation Targets

### Phase 11 Task Breakdown

| Task | Target Components | Key Changes |
|------|------------------|-------------|
| **TASK-11.1** | This document | Create mapping artifact |
| **TASK-11.2** | LandingPage.tsx | Hero, CTA, feature cards |
| **TASK-11.3** | InterviewRoom.tsx, AiVisualizer.tsx | Status cards, controls, preview panels |
| **TASK-11.4** | SessionSummary.tsx | Layout rhythm, card emphasis |
| **TASK-11.5** | Session config modal (future) | Alignment with visual system |
| **TASK-11.6** | Shared primitives | Extract reusable components |
| **TASK-11.7** | All pages | Visual consistency QA |

### Reusable Primitives to Extract (TASK-11.6)

Based on current duplication patterns:

| Primitive | Current Duplication | Proposed Component |
|-----------|-------------------|-------------------|
| **Surface Card** | `bg-gray-800 rounded-xl p-6 shadow-xl` | `<Card variant="primary">` |
| **Secondary Card** | `bg-gray-800 rounded-lg p-4` | `<Card variant="secondary">` |
| **Status Pill** | `bg-{color}-900/30 text-{color}-300` | `<Badge status="active\|warning\|success">` |
| **Section Header** | `text-2xl font-bold mb-4` | `<SectionHeader>` |
| **Primary Button** | Blue CTA with icon | `<Button variant="primary">` |
| **Secondary Button** | Gray action button | `<Button variant="secondary">` |
| **Metric Card** | Icon + label + value layout | `<MetricCard icon="" label="" value="">` |

**Target File**: `/frontend/src/components/primitives/` (new directory)

### Visual Consistency Checklist (TASK-11.7)

- [ ] All cards use consistent corner radius (`rounded-lg` vs `rounded-xl` standardization)
- [ ] Spacing scale follows Tailwind increments (4, 6, 8, 12, 16)
- [ ] Color palette limited to defined system colors
- [ ] Typography scale consistent across pages
- [ ] Button hierarchy respected (no primary-styled secondary actions)
- [ ] Status indicators use semantic colors
- [ ] Icons from lucide-react library only
- [ ] Responsive breakpoints consistent (`md:`, `lg:`)
- [ ] Shadow depths follow elevation system (`shadow-lg`, `shadow-xl`, `shadow-2xl`)
- [ ] Animations use Tailwind transitions or custom CSS with consistent timing

---

## Dependencies

**Configuration Files:**
- `/frontend/tailwind.config.js` - Tailwind theme extensions
- `/frontend/src/index.css` - Global styles, custom animations

**Component Files:**
- `/frontend/src/pages/LandingPage.tsx`
- `/frontend/src/pages/InterviewRoom.tsx`
- `/frontend/src/pages/SessionSummary.tsx`
- `/frontend/src/components/NavBar.tsx`
- `/frontend/src/components/AiVisualizer.tsx`

**Icon Library:**
- `lucide-react` v0.294.0

**Styling Stack:**
- Tailwind CSS v3.4.0
- PostCSS with autoprefixer

---

## Acceptance Criteria Met

✅ **AC #1**: This artifact links each prototype visual pattern (palette, typography, spacing, card treatments, status indicators, button hierarchy) to at least one concrete current-page target component.

**Mappings Provided:**
- Color palette → All page components + index.css
- Typography → Hero, headers, body text with specific file:line references
- Spacing → Card padding, section gaps, responsive containers
- Card treatments → Primary/secondary/status cards with styling patterns
- Status indicators → AI speaking, audio active, screen share, timers
- Button hierarchy → Primary CTA, secondary, destructive, toggles

**Implementation Readiness:**
- Tasks 11.2, 11.3, 11.4 can now reference this document for specific component targets
- Task 11.6 has a clear list of primitives to extract
- Task 11.7 has a QA checklist for visual consistency

---

**Document Status**: ✅ Ready for Implementation
**Next Steps**: Begin TASK-11.2 (Landing Page Visual Refresh)
