# CollabCode - Collaborative Code Platform

A comprehensive MERN-based platform for real-time code collaboration, issue tracking, and team communication.

## Features

- **Real-Time Code Collaboration**: Multiple developers can edit code simultaneously with live updates via WebSockets
- **Issue Tracking System**: Create, manage, and track issues with priority levels and status updates
- **Issue Discussion**: Comment on issues to discuss solutions and collaborate on fixes
- **Stamps/Tags**: Add custom stamps to issues for categorization and tracking
- **Team Management**: Create teams and invite members to collaborate on projects
- **User Authentication**: Secure JWT-based authentication system
- **Live Notifications**: Real-time updates when team members join/leave projects

## Tech Stack

### Backend
- Node.js & Express
- MongoDB
- Socket.IO (real-time collaboration)
- JWT (authentication)

### Frontend
- React 18
- TypeScript
- React Router v6
- Tailwind CSS
- Socket.IO Client

## Setup Instructions

### Backend Setup
\`\`\`bash
cd server
npm install
# Create .env file with required variables
npm run dev
\`\`\`

### Frontend Setup
\`\`\`bash
cd client
npm install
npm run dev
\`\`\`

## Environment Variables

Create `.env` file in server directory:
\`\`\`
MONGODB_URI=mongodb://localhost:27017/collab-code
JWT_SECRET=your_jwt_secret_key
PORT=5000
CLIENT_URL=http://localhost:3000
\`\`\`

## Key Features Guide

### Creating Projects
1. Navigate to Dashboard
2. Click "New Project"
3. Add project name and description
4. Start coding with real-time collaboration

### Managing Issues
1. Go to Issues page from any project
2. Click "New Issue" to create
3. Add title, description, and priority
4. Use "Add Stamp" to tag issues
5. Change status as you work through fixes
6. Discuss in comments section

### Team Collaboration
1. Create or join teams
2. Invite team members via email
3. Assign projects to teams
4. Real-time updates on team activity

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Projects
- GET `/api/projects` - Get user's projects
- POST `/api/projects` - Create new project
- PATCH `/api/projects/:id/code` - Update code
- POST `/api/projects/:id/members` - Add member

### Issues
- GET `/api/issues/project/:projectId` - Get project issues
- POST `/api/issues` - Create issue
- PATCH `/api/issues/:id/status` - Update status
- POST `/api/issues/:id/stamps` - Add stamp

### Comments
- POST `/api/comments` - Add comment
- GET `/api/comments/issue/:issueId` - Get issue comments

## Future Enhancements

- Code syntax highlighting with Monaco Editor
- Real-time cursor tracking
- Code execution environment
- Pull requests and code review system
- Integration with GitHub/GitLab
- Advanced permissions and roles
hi"# CodeCollab" 
hiee