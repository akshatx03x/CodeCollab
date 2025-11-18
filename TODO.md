`# TODO: Implement Multi-File Code Editor Feature

## Steps to Complete

1. **Update Project Model**:
   - Modify `server/models/Project.js` to replace the single `code` field with a `files` array (e.g., `[{ name: string, content: string }]`).
   - Set a default initial file like "main.js" with empty content for new projects.
   - Ensure backward compatibility by migrating existing single `code` to a file array if needed.

2. **Add Server Routes for File Management**:
   - In `server/routes/code.js`, implement the following routes:
     - GET `/api/projects/:projectId/files` to fetch all files for a project.
     - POST `/api/projects/:projectId/files` to add a new file (body: { name: string, content?: string }).
     - PATCH `/api/projects/:projectId/files/:fileName` to update a file's content (body: { content: string }).
     - DELETE `/api/projects/:projectId/files/:fileName` to remove a file.
   - Add authentication middleware to ensure only project members can access these routes.

3. **Update Project Fetching Route**:
   - Modify `server/routes/projects.js` to include the `files` field when fetching a project by ID.

4. **Refactor ProjectPage.tsx UI**:
   - Expand the left sidebar into a file explorer component to list files.
   - Add functionality to select a file from the explorer to display in the editor.
   - Update the file tabs area to show multiple open files and allow switching between them.
   - Add a button/input in the file explorer to create new files.
   - Replace the single textarea with dynamic content based on the selected file.

5. **Integrate Real-Time Collaboration for Files**:
   - Update Socket.IO events in `ProjectPage.tsx` and server-side to handle file-specific updates (e.g., emit "file-updated" with fileName and newContent).
   - Listen for "file-updated" events to sync changes across users in real-time.

6. **Testing and Verification**:
   - Run the client and server to test the new UI and functionality.
   - Verify real-time collaboration works for multiple files.
   - Check backward compatibility for existing projects (ensure single code is migrated or handled gracefully).

7. **Cleanup and Final Touches**:
   - Remove any placeholder code in `server/routes/code.js`.
   - Update any relevant documentation or comments.
   - Ensure error handling for file operations (e.g., duplicate names, invalid files).
