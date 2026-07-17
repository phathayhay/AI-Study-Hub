# AI Study Hub Redundancy Audit and Cleanup Plan

## 1. Document Purpose

This document is the reviewed cleanup baseline for AI Study Hub. It identifies redundant code and repository artifacts, but it is not permission to delete every listed item at once.

The cleanup must be delivered as small, independently verifiable pull requests. Payment, authentication, document upload, AI generation, and subscription behavior must not be changed by a redundancy cleanup unless a separate product decision explicitly requires it.

## 2. Audit Baseline

| Field | Value |
| --- | --- |
| Audit date | 2026-07-17 |
| Branch inspected | `main` |
| Baseline commit | `06625e2` (`Improve AI quotas and admin interface`) |
| Repository state | Dirty worktree |
| Backend | Spring Boot 3.3.4, Java 21, Maven |
| Frontend | React, Vite, npm |
| Database | MySQL schema and additive patches |

### Important limitation

The worktree contained substantial uncommitted payment, subscription-plan versioning, frontend pricing, and database migration work during this audit. Therefore:

1. Commit or deliberately preserve the current feature work before starting cleanup.
2. Re-run all reference searches against the new clean baseline.
3. Never use broad commands such as `git add .` for cleanup commits.
4. Stage only the files belonging to the current cleanup batch.

### Evidence method

Candidates were checked using:

- Source-file enumeration with `rg --files`.
- Static import and symbol searches with `rg`.
- Git tracking checks with `git ls-files`, `git status`, and `git check-ignore`.
- Maven and npm descriptor inspection.
- Spring configuration and payment provider inspection.

Static analysis cannot prove runtime safety for Spring configuration, reflection, scheduled jobs, routes loaded through barrels, or environment-dependent providers. Build and smoke-test gates are mandatory.

## 3. Executive Verdict

| Decision group | Count | Meaning |
| --- | ---: | --- |
| Delete-ready frontend files | 12 | No active import or route was found; remove in one frontend-only batch |
| Delete-ready repository artifacts | 5 | Generated, local, or obsolete files; Git tracking differs by file |
| Atomic backend dependency cleanup | 2 areas | Remove source, configuration, and dependency together |
| Keep | 4 payment components | Active, configurable, or operationally valuable |
| Refactor later | 3 areas | Necessary code with overlapping responsibilities |

The strongest cleanup opportunities are old frontend service clients, unused utilities, duplicate admin pagination, generated repository artifacts, Firebase remnants, and an unused Vertex AI SDK dependency.

The payment fallback and VNPAY reconciliation components are not redundant at the current baseline and must not be deleted during general cleanup.

### Cleanup execution result

The reviewed cleanup was implemented on 2026-07-17 with the following safeguards and results:

| Area | Result |
| --- | --- |
| Repository artifacts | Tracked endpoint/lint dumps removed; local obsolete runner and temporary course note removed; Ollama installer retained locally but ignored |
| Frontend dead code | FE-01 through FE-12 removed; dead card/mock symbols removed |
| Frontend dependencies | `jszip`, `mammoth`, and `pdfjs-dist` removed with npm; lockfile synchronized |
| Backend obsolete integration | Firebase bootstrap/configuration and SDK removed; unused Vertex AI SDK removed |
| Storage implementation | Cloudinary services retained and unchanged |
| Payment/auth/upload behavior | Active implementations retained; no cleanup refactor applied |
| Frontend production build | Passed before and after cleanup |
| Frontend lint baseline | Improved from 82 findings (74 errors, 8 warnings) to 79 findings (71 errors, 8 warnings); remaining findings predate this cleanup |
| Backend test baseline | 62 tests passed before cleanup and 62 tests passed after cleanup |
| Backend startup smoke test | Passed on an isolated random port; smoke-test process stopped afterward |

No behavior regression was detected by the available automated checks and startup smoke test. Manual browser smoke testing remains recommended after pulling the cleanup commit.

## 4. Decision Matrix

### 4.1 Delete-ready frontend files

These files have no active import, route, or symbol consumer in `src/` at the audit baseline.

| ID | Path | Evidence | Required companion change | Risk |
| --- | --- | --- | --- | --- |
| FE-01 | `ai-studyhub-frontend/src/pages/Home.jsx` | Superseded by `pages/public/Home.jsx`; no consumer found | None | Low |
| FE-02 | `ai-studyhub-frontend/src/pages/study-hub/StudyDocumentApi.jsx` | Active study route imports `StudySessionPage` directly | None | Low |
| FE-03 | `ai-studyhub-frontend/src/pages/study-hub/UploadPageApi.jsx` | Active uploader is `pages/public/Upload.jsx`; no route found | None | Low |
| FE-04 | `ai-studyhub-frontend/src/utils/fileParser.js` | Exported functions have no consumer | Remove `jszip`, `mammoth`, and `pdfjs-dist` | Low |
| FE-05 | `ai-studyhub-frontend/src/utils/validate.js` | `validateEmail` has no consumer | None | Low |
| FE-06 | `ai-studyhub-frontend/src/hooks/useDebounce.js` | Hook has no consumer | None | Low |
| FE-07 | `ai-studyhub-frontend/src/services/adminService.js` | Admin pages use `features/admin/adminService.js` | None | Low |
| FE-08 | `ai-studyhub-frontend/src/services/aiAssistService.js` | AI requests use `features/ai/aiService.js` | None | Low |
| FE-09 | `ai-studyhub-frontend/src/services/aiChatService.js` | AI requests use `features/ai/aiService.js` | None | Low |
| FE-10 | `ai-studyhub-frontend/src/services/documentService.js` | Document pages use `features/documents/documentService.js` | None | Low |
| FE-11 | `ai-studyhub-frontend/src/services/folderService.js` | Folder pages use `features/folders/folderService.js` | None | Low |
| FE-12 | `ai-studyhub-frontend/src/features/admin/components/AdminPagination.jsx` | Admin logs use the implementation in `tables/AdminTableComponents.jsx` via `legacyShared.js` | Remove its export from `features/admin/components/index.js` | Low |

#### Dead symbols inside active files

These should be removed in the same frontend cleanup batch, not by deleting their containing files:

| File | Symbols |
| --- | --- |
| `ai-studyhub-frontend/src/pages/study-hub/shared.jsx` | `ExploreFolderCard`, `DocumentCardMini` |
| `ai-studyhub-frontend/src/pages/study-hub/config.js` | `adminUsers`, `adminDocuments` |

### 4.2 Repository artifacts and local files

The original audit incorrectly classified several tracked files as untracked. Use the action appropriate to the actual Git state.

| ID | Path | Current state | Decision | Correct action |
| --- | --- | --- | --- | --- |
| REPO-01 | `ai-studyhub-frontend/folder_api_details.json` | Tracked | Delete | Remove with `git rm` |
| REPO-02 | `ai-studyhub-frontend/eslint-errors.txt` | Tracked | Delete | Remove with `git rm`; ignore generated lint logs if recreated |
| REPO-03 | `ai-studyhub-frontend/eslint-errors-utf8.txt` | Tracked | Delete | Remove with `git rm`; ignore generated lint logs if recreated |
| REPO-04 | `start_backend.ps1` | Local and ignored | Delete locally | No Git removal is required unless it exists in another branch |
| REPO-05 | `mon_hoc_swp391.txt` | Untracked | Delete or move to intentional documentation | Do not commit as a root-level temporary note |
| REPO-06 | `OllamaSetup.exe` | Untracked and not ignored | Keep outside repository | Add a targeted ignore entry, then remove the local copy when no longer needed |

Do not use a blanket `*.exe` ignore rule unless the team confirms that executable fixtures or tools will never be versioned. Prefer `/OllamaSetup.exe`.

### 4.3 Remove atomically after verification

#### BACKEND-01: Firebase remnants

Firebase storage has been replaced by Cloudinary. No active source consumer of Firebase SDK classes was found outside `FirebaseConfig.java`.

Remove these together in one commit:

1. `ai-studyhub-backend/src/main/java/com/studyhub/config/FirebaseConfig.java`
2. The `com.google.firebase:firebase-admin` dependency from `pom.xml`
3. Firebase properties from Spring configuration
4. Obsolete Firebase environment keys from `.env.example` and documentation, if present

Risk is medium because `FirebaseConfig` is a Spring-discovered configuration class. A clean backend test and startup smoke test are mandatory.

#### BACKEND-02: Vertex AI SDK dependency

`google-cloud-vertexai` is declared in `pom.xml`, but no Vertex AI SDK class import was found. Gemini is called through REST APIs.

Decision: remove the Maven dependency in an isolated commit and run a clean backend build. Do not change the active Gemini REST implementation in the same commit.

### 4.4 Keep: active payment and recovery components

| ID | Component | Decision | Reason |
| --- | --- | --- | --- |
| KEEP-01 | `payment/SandboxPaymentGateway.java` | Keep | `CUSTOM_SANDBOX` remains the configured default fallback and the class has tests |
| KEEP-02 | `pages/public/PaymentFlow.jsx` | Keep | Required when the custom sandbox provider is selected |
| KEEP-03 | `payment/vnpay/VnpayAdminPaymentController.java` | Keep | Provides manual operational recovery for stuck or missed VNPAY callbacks |
| KEEP-04 | `payment/vnpay/VnpayReconciliationService.java` | Keep | Supports VNPAY reconciliation and is used by the admin controller |

These components may be reconsidered only after a product decision makes VNPAY the sole provider, the default configuration changes, fallback routes are removed, and payment tests are updated.

### 4.5 Keep: subscription snapshot columns

The following are intentionally denormalized compatibility fields, not cleanup targets:

- `users.plan_id`
- `user_subscriptions.plan_id`
- `user_subscriptions.plan_version_id`
- Payment references to the purchased plan/version

Plan-version snapshots preserve the entitlements purchased by an existing subscriber when an administrator changes future plan pricing or quotas. Removing these columns requires a separate data-model migration and measured query-impact analysis.

## 5. Refactoring Backlog - Do Not Mix with Cleanup

### RF-01: Consolidate frontend authentication clients

Both authentication clients are active:

- `features/auth/authService.js` is used by profile security, verification, password reset, and logout flows.
- `services/authService.js` is used by login and registration.

Do not delete either file directly. First define one canonical API boundary, move all methods, update every import, and run the full authentication flow. The preferred destination should follow the feature-based architecture already used by documents, folders, AI, and admin services; therefore `features/auth/authService.js` is the more consistent default unless the team formally chooses a global-service architecture.

### RF-02: Standardize admin components

Standalone admin components and `tables/AdminTableComponents.jsx` are both active. Pick one structure and migrate incrementally. Split components are easier to own and test; the bundled file reduces file count but currently creates duplicate implementations.

Fix existing encoding artifacts in admin sort arrows while touching this area.

### RF-03: Split `SubscriptionService`

`SubscriptionService` combines quote calculation, subscription activation, payment status, sandbox handling, and persistence orchestration.

Recommended target responsibilities:

- `UpgradeQuoteCalculator`
- `SubscriptionActivationService`
- `SubscriptionPaymentService`
- `SandboxPaymentService`

This is an architecture refactor, not a redundancy deletion. Preserve transactional boundaries and add focused tests before moving behavior.

## 6. Configuration and Security Review

### 6.1 Database defaults

`application.yml` and `application-dev.yml` use inconsistent fallback database passwords. Prefer requiring `DB_PASSWORD` from the environment. If a developer fallback is retained, make it consistent and clearly development-only.

### 6.2 Environment files

- `.env` must remain ignored.
- `.env.example` must contain placeholders only, never working merchant secrets, JWT secrets, API keys, or database credentials.
- Before pushing, inspect staged content with `git diff --cached`.
- A separate secret-history scan is required before claiming that the repository has no security-sensitive findings.

### 6.3 Runner governance

`run-project.ps1` is treated as the main local runner but is currently ignored. The team must choose one policy:

1. Keep it local and document the required commands in a tracked README; or
2. Track a sanitized runner that reads all machine-specific values from `.env`.

Do not keep a critical team workflow in an ignored file without tracked documentation.

## 7. Cleanup Delivery Plan

Do not start this plan until the current worktree has a known clean feature baseline.

### PR 1: Repository hygiene

Scope:

- Delete tracked dump and lint-output files.
- Add targeted ignore entries for local artifacts.
- Remove obsolete local scripts and notes.

Acceptance gates:

- `git status` contains no accidental installer, log, dump, or secret file.
- Frontend and backend source are unchanged.

### PR 2: Frontend dead code

Scope:

- Remove FE-01 through FE-12.
- Remove dead symbols from active files.
- Remove `jszip`, `mammoth`, and `pdfjs-dist` with npm so both `package.json` and `package-lock.json` stay synchronized.

Acceptance gates:

```powershell
cd ai-studyhub-frontend
npm run lint
npm run build
```

Smoke-test login, registration, Explore filters, upload, document detail, admin logs, AI summary, flashcards, quizzes, and chat.

### PR 3: Backend obsolete dependencies

Scope:

- Remove Firebase remnants atomically.
- Remove the unused Vertex AI SDK dependency.

Acceptance gates:

```powershell
cd ai-studyhub-backend
mvn clean test
mvn spring-boot:run
```

Confirm application startup, Cloudinary upload, document preview/download, notification loading, Gemini/Ollama selection, and subscription endpoints.

### PR 4 and later: architecture refactors

Handle authentication consolidation, admin component standardization, and `SubscriptionService` decomposition as separate behavior-preserving PRs. Each PR requires focused tests and must not contain repository-hygiene changes.

## 8. Pre-Cleanup Checklist

- [ ] Current feature work is committed, backed up, or intentionally preserved.
- [ ] The cleanup branch starts from an agreed commit.
- [ ] Static reference searches have been rerun.
- [ ] No generated file is mistaken for an untracked file.
- [ ] Payment provider decisions are documented.
- [ ] `.env.example` contains placeholders only.
- [ ] Database patches are retained unless a migration review explicitly removes them.
- [ ] Each cleanup PR has a rollback point.

## 9. Definition of Done

The cleanup is complete only when:

1. Frontend lint and production build pass.
2. Backend clean tests pass and the application starts successfully.
3. Authentication, upload, document access, AI generation, subscriptions, VNPAY callbacks, and admin workflows pass smoke testing.
4. No secret, installer, generated log, or local dump is staged.
5. Every deletion can be traced to a reviewed decision in this document.
6. Cleanup and behavior refactoring remain in separate commits.

## 10. Final Recommendation

The reviewed PR 1 through PR 3 cleanup scope has been implemented and verified against the recorded baseline. Keep all payment fallback and reconciliation components. Perform authentication consolidation, admin component standardization, and `SubscriptionService` decomposition only as separate future refactors with their own tests and rollback points.
