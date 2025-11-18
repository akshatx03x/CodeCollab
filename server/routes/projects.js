import express from "express"
import Project from "../models/Project.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create project
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description, language } = req.body
    const project = new Project({
      name,
      description,
      language,
      owner: req.userId,
      members: [req.userId],
    })
    await project.save()
    res.status(201).json(project)
  } catch (error) {
    res.status(500).json({ message: "Failed to create project" })
  }
})

// Get all projects (public access)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find({}).populate("owner members")
    res.json(projects)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch projects" })
  }
})

// Get single project
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate("owner members")
    if (!project) return res.status(404).json({ message: "Project not found" })
    res.json(project)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch project" })
  }
})

// Add member to project
router.post("/:id/members", verifyToken, async (req, res) => {
  try {
    const { userId } = req.body
    const project = await Project.findById(req.params.id)
    if (!project.members.includes(userId)) {
      project.members.push(userId)
      await project.save()
    }
    res.json(project)
  } catch (error) {
    res.status(500).json({ message: "Failed to add member" })
  }
})

// Update code
router.patch("/:id/code", verifyToken, async (req, res) => {
  try {
    const { code } = req.body
    const project = await Project.findByIdAndUpdate(req.params.id, { code, updatedAt: new Date() }, { new: true })
    res.json(project)
  } catch (error) {
    res.status(500).json({ message: "Failed to update code" })
  }
})

export default router
