# Fix Build Error: Missing UUID Types & User Password Schema Mismatch

## Goal Description
The goal is to resolve TypeScript build errors.
1.  **Missing `uuid` types**: Resolved by installing `uuid` and `@types/uuid`.
2.  **Missing `password` in User Invite**: The `User` model requires a `password`, but the invite API endpoint does not provide one.

## Problem Analysis
### Issue 1: UUID (Resolved)
- `uuid` and `@types/uuid` were missing. Installed.

### Issue 2: Password Mismatch
- **File**: `src/app/api/settings/users/invite/route.ts`
- **Error**: `Property 'password' is missing...`
- **Cause**: The `User` table in `prisma/schema.prisma` defines `password` as a required `String`. The invitation logic creates a user without setting a password.

## Proposed Changes

### Dependencies
- (Completed) Install `uuid` and `@types/uuid`.

### Code Changes
#### [MODIFY] src/app/api/settings/users/invite/route.ts
- Import `v4 as uuidv4` from `uuid`.
- In `prisma.user.create`, add `password: uuidv4()`.
    - *Rationale*: Set a random, high-entropy placeholder password. The user cannot login with this (since it's not known/hashed properly for substantial login, usually), but it satisfies the DB requirement. The user will define their own password upon accepting the invite/resetting.

## Verification Plan
1.  Run `npm run build`.
2.  Verify successful compilation.
