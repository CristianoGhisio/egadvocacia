# Implementation Plan - Case Management Module

## Goal Description
Implement "Deadlines" (Prazos) and "Hearings" (Audiências) management within the CRM Case module. This allows lawyers to track critical dates and events linked to specific legal matters.

## User Review Required
> [!NOTE]
> This phase extends the existing "Case Detail" page with functional tabs for Deadlines and Hearings.

## Proposed Changes

### Backend (API)
#### [NEW] [src/app/api/cases/[id]/deadlines/route.ts](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/api/cases/[id]/deadlines/route.ts)
- GET: List deadlines for a specific case.
- POST: Create a new deadline for the case.
- PATCH: Mark deadline as completed.

#### [NEW] [src/app/api/cases/[id]/hearings/route.ts](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/api/cases/[id]/hearings/route.ts)
- GET: List hearings for a specific case.
- POST: Schedule a new hearing.
- PATCH: Update hearing details/status.

### Frontend (UI)
#### [NEW] [src/components/cases/deadline-list.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/components/cases/deadline-list.tsx)
- Component to list deadlines with checkboxes for completion.
- "Add Deadline" dialog.

#### [NEW] [src/components/cases/hearing-list.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/components/cases/hearing-list.tsx)
- Component to list hearings with date/location info.
- "Add Hearing" dialog.

#### [MODIFY] [src/app/dashboard/cases/[id]/page.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/dashboard/cases/[id]/page.tsx)
- Integrate `DeadlineList` into the "Prazos" tab.
- Integrate `HearingList` into a new "Audiências" tab (or rename Prazos to Agenda).

## Verification Plan

### Manual Verification
1.  **Open Case**: Navigate to an existing case detail page.
2.  **Add Deadline**: Create a deadline for "Contestação" due next week. Verify it appears in the list.
3.  **Complete Deadline**: Check the box to mark it as completed. Verify visual update.
4.  **Add Hearing**: Schedule a hearing. Verify it appears.
