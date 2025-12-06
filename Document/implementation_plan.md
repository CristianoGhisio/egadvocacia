# Implementation Plan - Document Management (GED)

## Goal Description
Implement the **Document Management System (GED)** to allow uploading, categorizing, and listing files linked to Cases and Clients.
Given the local SQLite architecture, files will be stored locally in `public/uploads` for simplicity in this MVP phase.

## User Review Required
> [!NOTE]
> **Storage Strategy**: Files will be saved locally in the `public/uploads` directory. In a production cloud environment (like Vercel), this would need to be changed to object storage (AWS S3, R2, etc.). For local usage, this is sufficient.

## Proposed Changes

### Backend (API)
#### [NEW] [src/app/api/documents/route.ts](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/api/documents/route.ts)
- POST: Handle `multipart/form-data` uploads.
  - Save file to `public/uploads/YYYY/MM/`.
  - Create `Document` record in Prisma.
- GET: List documents (supports filtering by `matterId` or `clientId`).

#### [NEW] [src/app/api/documents/[id]/route.ts](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/api/documents/[id]/route.ts)
- DELETE: Delete DB record and unlink file from filesystem.
- GET: Get document metadata.

### Frontend (UI)
#### [NEW] [src/components/documents/document-upload.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/components/documents/document-upload.tsx)
- Button/Dropzone to select files.
- Progress indicator.
- Associated metadata fields (Name, Type).

#### [NEW] [src/components/documents/document-list.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/components/documents/document-list.tsx)
- Data table listing documents.
- Actions: Download (link to `/uploads/...`), Delete.
- Icon according to file type (PDF, Image, Word).

#### [MODIFY] [src/app/dashboard/cases/[id]/page.tsx](file:///c:/Users/crist/Desktop/PROJETOS/egadvocacia/src/app/dashboard/cases/[id]/page.tsx)
- Integrate `DocumentUpload` and `DocumentList` into the "Documentos" tab.

## Verification Plan

### Manual Verification
1.  **Upload**: Go to a Case Detail page, upload a PDF. Verify it appears in the list.
2.  **Persistence**: Verify the file exists in `public/uploads`.
3.  **Download**: Click the file name/icon and verify it opens/downloads.
4.  **Delete**: Remove the file and verify it's gone from UI and disk.
