import express from "express"
import Issue from "../models/Issue.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create issue
router.post("/", verifyToken, async (req, res) => {
  try {
    const { projectId, title, description, priority } = req.body
    const issue = new Issue({
      project: projectId,
      title,
      description,
      priority,
      creator: req.userId,
    })
    await issue.save()
    await issue.populate("creator assignee")
    res.status(201).json(issue)
  } catch (error) {
    res.status(500).json({ message: "Failed to create issue" })
  }
})

// Get issues for project
router.get("/project/:projectId", async (req, res) => {
  try {
    const issues = await Issue.find({ project: req.params.projectId }).populate("creator assignee")
    res.json(issues)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch issues" })
  }
})

// Update issue status
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const { status } = req.body
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true },
    ).populate("creator assignee")
    res.json(issue)
  } catch (error) {
    res.status(500).json({ message: "Failed to update issue" })
  }
})

// Add stamp to issue
router.post("/:id/stamps", verifyToken, async (req, res) => {
  try {
    const { label, color } = req.body
    const issue = await Issue.findById(req.params.id)
    issue.stamps.push({
      label,
      color,
      createdBy: req.userId,
    })
    await issue.save()
    res.json(issue)
  } catch (error) {
    res.status(500).json({ message: "Failed to add stamp" })
  }
})

// Assign issue
router.patch("/:id/assign", verifyToken, async (req, res) => {
  try {
    const { assigneeId } = req.body
    const issue = await Issue.findByIdAndUpdate(
      req.params.id,
      { assignee: assigneeId, updatedAt: new Date() },
      { new: true },
    ).populate("creator assignee")
    res.json(issue)
  } catch (error) {
    res.status(500).json({ message: "Failed to assign issue" })
  }
})

export default router
