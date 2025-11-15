import express from "express"
import Project from "../models/Project.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Get code
router.get("/:projectId", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: "Project not found" })
    res.json({ code: project.code })
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch code" })
  }
})

export default router
