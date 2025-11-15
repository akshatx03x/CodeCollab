import express from "express"
import Comment from "../models/Comment.js"
import { verifyToken } from "../middleware/auth.js"

const router = express.Router()

// Create comment
router.post("/", verifyToken, async (req, res) => {
  try {
    const { issueId, content } = req.body
    const comment = new Comment({
      issue: issueId,
      author: req.userId,
      content,
    })
    await comment.save()
    await comment.populate("author")
    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: "Failed to create comment" })
  }
})

// Get comments for issue
router.get("/issue/:issueId", async (req, res) => {
  try {
    const comments = await Comment.find({ issue: req.params.issueId }).populate("author").sort({ createdAt: 1 })
    res.json(comments)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch comments" })
  }
})

export default router
