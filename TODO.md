# Fix Null Owner Name Error on Dashboard

## Steps to Complete:
1. [x] Edit server/routes/projects.js: Filter projects with null owners after populate in GET /
2. [x] Edit client/src/pages/DashboardPage.tsx: Add optional chaining `project.owner?.name || 'Unknown'` in render
3. [ ] Test: Restart server, reload dashboard, verify no crash and displays correctly
4. [ ] [Complete] Verify fix works for all projects

