import express from "express"
import Project from "../models/Project.js"
import verifyToken from "../middleware/auth.js"

const router = express.Router()

// GET /api/projects/:projectId/files - Fetch all files for a project
router.get("/projects/:projectId/files", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params
    const project = await Project.findById(projectId).populate("members", "name")

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user is a member
    if (!project.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    res.json(project.files)
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// POST /api/projects/:projectId/files - Add a new file
router.post("/projects/:projectId/files", verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params
    const { name, content = "" } = req.body

    if (!name) {
      return res.status(400).json({ message: "File name is required" })
    }

    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user is a member
    if (!project.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    // Check for duplicate file name
    if (project.files.some(file => file.name === name)) {
      return res.status(400).json({ message: "File name already exists" })
    }

    project.files.push({ name, content })
    await project.save()

    res.status(201).json({ message: "File added successfully", file: { name, content } })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// PATCH /api/projects/:projectId/files/:fileName - Update a file's content
router.patch("/projects/:projectId/files/:fileName", verifyToken, async (req, res) => {
  try {
    const { projectId, fileName } = req.params
    const { content } = req.body

    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user is a member
    if (!project.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const file = project.files.find(f => f.name === fileName)
    if (!file) {
      return res.status(404).json({ message: "File not found" })
    }

    file.content = content
    await project.save()

    res.json({ message: "File updated successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

// DELETE /api/projects/:projectId/files/:fileName - Remove a file
router.delete("/projects/:projectId/files/:fileName", verifyToken, async (req, res) => {
  try {
    const { projectId, fileName } = req.params

    const project = await Project.findById(projectId)

    if (!project) {
      return res.status(404).json({ message: "Project not found" })
    }

    // Check if user is a member
    if (!project.members.some(member => member._id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Access denied" })
    }

    const fileIndex = project.files.findIndex(f => f.name === fileName)
    if (fileIndex === -1) {
      return res.status(404).json({ message: "File not found" })
    }

    project.files.splice(fileIndex, 1)
    await project.save()

    res.json({ message: "File deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Server error" })
  }
})

export default router
