---
id: doc-12
title: UI Visual Mapping - Prototype to Product
type: mapping
created_date: '2026-03-28 17:48'
---

# Prototype-to-Product Visual Mapping

## Scope
Map prototype visual language into the authenticated production app while preserving existing architecture and API contracts.

## Design Tokens and Global Direction
| Prototype Pattern | Product Mapping | Target Files |
|---|---|---|
| Dark cinematic canvas + glow accents | Dark base (`slate/gray` surfaces) plus gradient orbs and subtle blur overlays | `frontend/src/pages/LandingPage.tsx`, `frontend/src/pages/InterviewRoom.tsx`, `frontend/src/pages/SessionSummary.tsx` |
| High-contrast hierarchy | Large display headings + compact uppercase labels for context | `frontend/src/components/primitives/SectionHeader.tsx` |
| Layered card system | Reusable card variants (`primary`, `secondary`, `elevated`) replacing ad-hoc containers | `frontend/src/components/primitives/Card.tsx` |
| Status semantics | Shared info/success/warning/error badge styling and meaning | `frontend/src/components/primitives/Badge.tsx` |
| Primary action emphasis | Shared button variants and size scale across screens | `frontend/src/components/primitives/Button.tsx` |

## Screen-by-Screen Mapping
| Prototype Screen | Product Screen | Adopted Visual Patterns | Concrete Components/Files |
|---|---|---|---|
| Marketing + launch panel | Landing | Hero gradient headline, feature cards, premium CTA block, concise value props | `frontend/src/pages/LandingPage.tsx`, primitives (`Card`, `Badge`, `Button`, `SectionHeader`) |
| Live coaching workspace | Interview Room | Split editor + coaching rail, persistent control bar, live status chips, activity visualizer | `frontend/src/pages/InterviewRoom.tsx`, `frontend/src/components/AiVisualizer.tsx`, primitives |
| Post-session evaluation | Session Summary | Result hero, score bars, metric tiles, grouped feedback panels | `frontend/src/pages/SessionSummary.tsx`, `frontend/src/components/primitives/MetricCard.tsx` |
| Session configuration modal | Session Config | Lightweight decision modal with direct start path and clear action hierarchy | `frontend/src/components/SessionConfigModal.tsx`, shared buttons/cards |

## Component Mapping Register
| Prototype Intent | Shared Primitive | Usage Targets |
|---|---|---|
| Surface rhythm and spacing | `Card` | Landing feature/CTA panels, interview side panels, summary sections |
| Semantic status labels | `Badge` | Plan/status chips, readiness labels, result tone labels |
| Action hierarchy | `Button` | Start/stop interview controls, screen-share controls, navigation CTAs |
| Consistent section titles | `SectionHeader` | Landing, interview sidebar sections, summary major sections |
| Compact KPI blocks | `MetricCard` | Summary metrics strip and dashboard-like tiles |

## Responsive and Consistency Targets
- Desktop/laptop focus: stable 2-column layouts where needed (`Landing`, `InterviewRoom`, `SessionSummary`).
- Mobile fallback: stacked sections with preserved action prominence and readable line lengths.
- Shared primitives are the default path for new visual sections; avoid one-off utility duplication.

## Contract Safety
- No backend API or websocket contract changes are required by this visual adoption plan.
- UI adoption is strictly presentational and component-structure oriented.

## Readiness for QA
This mapping is sufficient to execute final visual QA checks under `TASK-11.7` (layout consistency, readability, spacing, hierarchy, and responsive behavior).
