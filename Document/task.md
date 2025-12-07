# Task Checklist: Legal ERP/CRM Implementation

## Phase 1: Project Setup & Infrastructure
- [x] Initialize Next.js project with App Router
- [ ] Setup Supabase project and database
- [ ] Configure Vercel deployment
- [x] Setup environment variables (.env)
- [x] Configure TypeScript and ESLint
- [x] Setup Tailwind CSS and shadcn/ui
- [x] Create project folder structure


## Phase 3: Authentication & Security Module
- [ ] Configure Supabase Auth (JWT, OAuth, SSO)
- [ ] Implement 2FA support
- [ ] Create role-based access control (RBAC) system
- [ ] Build user management interface
- [ ] Implement permission system by module/action/field
- [ ] Create audit log viewer
- [ ] Setup LGPD compliance features (consent, data export)
- [ ] Implement encryption for sensitive data

## Phase 4: CRM / Client Intake Module
- [ ] Create lead capture form
- [ ] Build lead/opportunity pipeline interface (Kanban)
- [x] Implement client registration (PF/PJ)
- [x] Create contact management system
  - [x] List contacts in client detail
  - [x] Add/Edit contact form (Modal)
- [x] Build interaction history timeline
  - [x] List interactions in client detail
- [ ] Build case checklist templates
- [ ] Implement case status workflow
- [ ] Create case risk scoring

## Phase 6: Deadline & Calendar Management
- [x] Build central calendar interface
  - [x] Backend API (`/api/calendar/events`)
  - [x] Frontend Calendar Components
  - [x] Calendar Page (`/dashboard/calendar`)
- [ ] Implement deadline calculation engine
- [ ] Setup alert/notification system
- [ ] Create Google Calendar/Outlook integration
- [x] Build "today's deadlines" dashboard (Implemented as Central Deadlines Page)
- [ ] Implement task Kanban board
- [ ] Setup escalation workflows

## Phase 7: Document Management
- [ ] Setup Supabase Storage buckets with RLS
- [ ] Create document upload interface
- [ ] Implement document versioning
- [ ] Build template library system
- [ ] Create template editor with merge fields
- [ ] Implement digital signature integration (ClickSign)
- [ ] Build document search with OCR
- [ ] Create document access control
- [ ] Implement approval workflows

## Phase 8: Time Tracking & Billing Module
- [x] Create time tracking interface (manual + timer)
  - [x] API Routes (`/api/billing/time-entries`)
  - [x] UI Components (Form + List)
  - [x] Page (`/dashboard/time-tracking`)
- [ ] Implement different billing types (hourly, fixed, success fee)
- [ ] Build rate card management
- [x] Create invoice generation system
  - [x] API: Unbilled Hours (`/api/billing/unbilled`)
  - [x] API: Invoices CRUD (`/api/billing/invoices`)
  - [x] UI: Dashboard (`/dashboard/billing`)
  - [x] UI: Create Invoice Wizard (`/dashboard/billing/new`)
- [ ] Implement payment gateway integration (Stripe/Asaas)
- [ ] Build accounts receivable management
- [ ] Create trust account management
- [ ] Build billing reports

## Phase 9: Financial Module
- [ ] Create chart of accounts
- [ ] Implement general ledger
- [x] Build cashflow management
- [x] Create expense management
- [ ] Implement bank reconciliation
- [ ] Build financial reports (DRE, P&L)
- [ ] Create tax management features
- [ ] Implement partner profit sharing

## Phase 10: Contract Management (CLM)
- [ ] Create contract repository
- [ ] Build contract templates
- [ ] Implement version comparison
- [ ] Create renewal alerts
- [ ] Build digital signature workflow
- [ ] Create contract exposure reports

## Phase 11: Court Monitoring & Legal Intelligence
- [ ] Setup court monitoring webhook endpoints
- [ ] Create case update feed
- [ ] Build jurisprudence database
- [ ] Implement AI-powered case analysis (OpenAI)
- [ ] Create legal alerts system

## Phase 12: Workflow & Automation
- [ ] Create workflow designer interface
- [ ] Setup suggestion engine

## Phase 15: HR & Resource Management
- [ ] Create employee profiles
- [ ] Digital signature (ClickSign/DocuSign)
- [ ] AI integration (OpenAI)
- [ ] Calendar sync (Google/Outlook)
- [ ] Accounting software integration

## Phase 18: Compliance & Risk Management
- [ ] Create conflict check system
- [ ] Build risk assessment tools
- [ ] Implement approval workflows
- [ ] Create compliance reports

## Phase 19: Mobile & Notifications
- [ ] Setup push notification system
- [ ] Create mobile-responsive design
- [ ] Build PWA capabilities

## Phase 20: Testing, Documentation & Deployment
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Create user documentation
- [ ] Create API documentation
- [ ] Setup monitoring (Sentry)
- [ ] Configure production deployment
- [ ] Create backup/recovery procedures
