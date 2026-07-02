# Graph Report - FormWiz2  (2026-07-02)

## Corpus Check
- 26 files · ~26,639 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 87 nodes · 133 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `04ad0663`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `getDb()` - 8 edges
2. `setupDatabase()` - 8 edges
3. `FormField` - 6 edges
4. `FormWiz` - 5 edges
5. `PlanType` - 4 edges
6. `auth` - 4 edges
7. `UserSettings` - 3 edges
8. `analyzeFormImage()` - 3 edges
9. `handler()` - 3 edges
10. `handler()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `handler()` --calls--> `setupDatabase()`  [EXTRACTED]
  netlify/functions/create-checkout-session.ts → utils/db.ts
- `handler()` --calls--> `getDb()`  [EXTRACTED]
  netlify/functions/create-checkout-session.ts → utils/db.ts
- `handler()` --calls--> `setupDatabase()`  [EXTRACTED]
  netlify/functions/get-user.ts → utils/db.ts
- `handler()` --calls--> `getDb()`  [EXTRACTED]
  netlify/functions/get-user.ts → utils/db.ts
- `handler()` --calls--> `setupDatabase()`  [EXTRACTED]
  netlify/functions/stripe-webhook.ts → utils/db.ts

## Communities (12 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (6): DashboardProps, SavedForm, FormWizLogoProps, InstructionsProps, PrivacyPolicyProps, SplashProps

### Community 1 - "Community 1"
Cohesion: 0.19
Nodes (5): AuthProps, EnterpriseContactModalProps, PricingProps, STRIPE_PRICES, auth

### Community 2 - "Community 2"
Cohesion: 0.42
Nodes (7): handler(), stripe, handler(), handler(), stripe, getDb(), setupDatabase()

### Community 3 - "Community 3"
Cohesion: 0.38
Nodes (4): AccountSettingsProps, PDFDimensions, PlanType, UserSettings

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (3): PDFPreviewProps, VoiceInterviewerProps, FormField

### Community 5 - "Community 5"
Cohesion: 0.4
Nodes (5): breakTextIntoLines(), convertImageToPDF(), convertPDFToImages(), generateFilledPDF(), Window

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (5): Features, FormWiz, Setup, Tech Stack, Usage

### Community 8 - "Community 8"
Cohesion: 0.83
Nodes (3): analyzeFormImage(), handler(), parseFieldsFromResponse()

## Knowledge Gaps
- **25 isolated node(s):** `PLAN_LIMITS`, `container`, `root`, `PDFDimensions`, `cwd` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `analyzeFormImage()` connect `Community 11` to `Community 6`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `generateFilledPDF()` connect `Community 5` to `Community 6`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **Why does `FormField` connect `Community 4` to `Community 11`, `Community 3`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `PLAN_LIMITS`, `container`, `root` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._