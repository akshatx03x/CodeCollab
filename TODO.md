# TODO: Implement Active Collaborators Feature

## Tasks
- [x] Update ProjectPage.tsx to pass user.name on join-project
- [x] Update ProjectPage.tsx to emit leave-project on unmount
- [x] Update ProjectPage.tsx to handle user-left event to remove from activeUsers
- [x] Update server.js to store userName in activeEditors instead of userId
- [x] Update server.js to emit active-users to room on join and leave
- [x] Update server.js to emit user-joined with userName
- [x] Update ProtectedRoute to show login modal instead of redirect
- [x] Update App.tsx to remove login/register routes
- [x] Create LoginModal component
- [x] Add logout button to DashboardPage

## Followup Steps
- [ ] Test the collaboration by opening multiple tabs/users
