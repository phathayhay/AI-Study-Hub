# Merge Resolution Plan: hoangtan ← main

**Date:** 2026-06-17
**Current State:** 15 conflicted files, hoangtan branch needs merge from main
**Recommendation:** 3-phase merge strategy

---

## 🎯 Phase 1: Automated Conflict Resolution (Keep hoangtan base)

**Command to run:**
```bash
cd ai-studyhub-frontend

# Start merge
git merge main --no-commit --no-ff

# 1. Keep hoangtan for main service logic (tested production code)
git checkout --theirs \
  src/services/api.js \
  src/features/auth/authService.js \
  src/features/ai/aiService.js

# 2. Keep hoangtan for UI components (already styled)
git checkout --theirs \
  src/components/layout/AppLayout.jsx \
  src/components/layout/Sidebar.jsx \
  src/components/layout/Topbar.jsx

# 3. Keep hoangtan for page implementations
git checkout --theirs \
  src/pages/StudyHubApp.jsx \
  src/pages/study-hub/admin.jsx \
  src/pages/study-hub/auth.jsx \
  src/pages/study-hub/library.jsx \
  src/pages/study-hub/public-pages.jsx

# 4. Mark as resolved
git add .

# 5. Check status
git status
```

---

## 🔧 Phase 2: Manual Conflict Resolution

### **Priority 1: Fix useAuth.js (REQUIRED)**

**File:** `src/hooks/useAuth.js`

hoangtan has empty hook:
```js
export default function useAuth() {
  const [user] = useState(null)
  return { user }
}
```

main has full implementation:
```js
export default function useAuth() {
  const [user, setUser] = useState(loadUser)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => { /* load user from API */ }, [])
  
  const login = useCallback(async (email, password) => {
    // login logic
  }, [])
  
  return { user, setUser, loading, login, logout, refresh }
}
```

**Action:**
```bash
# Keep main implementation - hoangtan doesn't have it
git checkout --ours src/hooks/useAuth.js
git add src/hooks/useAuth.js
```

### **Priority 2: Merge package.json (REQUIRED)**

Both branches have dependencies but different versions.

**Current situation:**
- hoangtan: React, React Router basics
- main: Added PDF parsing libraries (pdf-parse, docx, etc.)

**Action:**
```bash
# Use main's package.json (has all dependencies)
git checkout --ours package.json
git checkout --ours package-lock.json
git add package.json package-lock.json

# Then run npm install to update lockfile
npm install
```

### **Priority 3: Merge vite.config.js (REQUIRED)**

**Action:**
```bash
# Use hoangtan base, add main's config
git checkout --theirs vite.config.js

# Then manually add proxy configs from main if needed
git add vite.config.js
```

### **Priority 4: Handle deleted file (DECISION NEEDED)**

**File:** `src/pages/study-hub/study-document.jsx`

- Status: Deleted in hoangtan, Modified in main
- Contains: Document viewer component with file parser

**Decision Options:**
```bash
# Option A: Keep deletion (use hoangtan structure)
git rm src/pages/study-hub/study-document.jsx

# Option B: Restore from main (use file parser implementation)
git checkout --ours src/pages/study-hub/study-document.jsx
```

**Recommendation:** Option A (keep deletion) - components are in `StudyDocumentApi.jsx`

---

## ✅ Phase 3: Verification & Testing

**After merge completes:**

```bash
# 1. Complete the merge
git commit -m "Merge main into hoangtan: resolve conflicts (keep hoangtan logic + main useAuth hook)"

# 2. Install dependencies
npm install

# 3. Build & test
npm run dev

# 4. Test critical flows:
- [ ] Login/Register flow
- [ ] Auth token refresh
- [ ] Upload document
- [ ] AI chat
- [ ] Folder operations
- [ ] File download
```

---

## 📋 Conflict Resolution Checklist

```
PHASE 1: Automated keeps
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✓] api.js → Keep hoangtan
[✓] authService.js → Keep hoangtan
[✓] aiService.js → Keep hoangtan
[✓] AppLayout.jsx → Keep hoangtan
[✓] Sidebar.jsx → Keep hoangtan
[✓] Topbar.jsx → Keep hoangtan
[✓] StudyHubApp.jsx → Keep hoangtan
[✓] admin.jsx → Keep hoangtan
[✓] auth.jsx → Keep hoangtan
[✓] library.jsx → Keep hoangtan
[✓] public-pages.jsx → Keep hoangtan

PHASE 2: Manual merges
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] useAuth.js → Keep main
[ ] package.json → Keep main
[ ] package-lock.json → Keep main
[ ] vite.config.js → Manual merge
[ ] study-document.jsx → Delete (Option A)

PHASE 3: Testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] npm install
[ ] npm run dev
[ ] Test auth flows
[ ] Test upload flows
[ ] Test chat flows
```

---

## 🚀 Expected Result After Merge

**Frontend will have:**
- ✅ Complete, tested API service layer (hoangtan)
- ✅ Production-ready auth flow (hoangtan)
- ✅ Modern React hooks for state management (main's useAuth)
- ✅ Support for file parsing (main's dependencies)
- ✅ All 15 conflicts resolved
- ✅ Ready for new feature development

**What we're NOT doing:**
- ❌ Breaking existing functionality
- ❌ Replacing tested code with untested code
- ❌ Losing session management logic
- ❌ Overwriting error handling

---

## 📝 Commands Summary (Copy & Paste)

```bash
# Go to frontend directory
cd ai-studyhub-frontend

# Stash any local changes
git stash

# Start merge
git merge main --no-commit --no-ff

# Keep hoangtan core files (production-ready)
git checkout --theirs src/services/api.js src/features/auth/authService.js src/features/ai/aiService.js
git checkout --theirs src/components/layout/AppLayout.jsx src/components/layout/Sidebar.jsx src/components/layout/Topbar.jsx
git checkout --theirs src/pages/StudyHubApp.jsx src/pages/study-hub/admin.jsx src/pages/study-hub/auth.jsx src/pages/study-hub/library.jsx src/pages/study-hub/public-pages.jsx

# Keep main for useAuth
git checkout --ours src/hooks/useAuth.js

# Manual merge - use main for dependencies
git checkout --ours package.json package-lock.json

# Mark all as resolved
git add .

# View status before committing
git status

# Commit the merge
git commit -m "Merge main: resolve conflicts - keep hoangtan logic + main useAuth hook"

# Install dependencies
npm install

# Test
npm run dev
```

---

## ⚠️ Common Pitfalls to Avoid

1. **❌ Don't:** Accept all conflicts from either side
   - ✅ Do: Cherry-pick best parts from each branch

2. **❌ Don't:** Merge without testing
   - ✅ Do: Run `npm run dev` after merge to verify

3. **❌ Don't:** Ignore useAuth.js
   - ✅ Do: Use main's implementation - hoangtan doesn't have it

4. **❌ Don't:** Break auth flow
   - ✅ Do: Keep hoangtan's authService logic intact

5. **❌ Don't:** Miss package.json updates
   - ✅ Do: Run `npm install` after merge

---

## 📞 Need Help?

If conflicts appear during merge:
1. Check `git status` to see remaining conflicts
2. Open conflicted file in VS Code
3. Use VS Code's merge editor (right-click > "Open in Merge Editor")
4. Choose which version to keep using the UI
5. Mark as resolved once done
