import express from "express"
import Team from "../models/Team.js"
import verifyToken from "../middleware/auth.js"

const router = express.Router()

// Create team
router.post("/", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body
    const team = new Team({
      name,
      description,
      owner: req.user.id,
      members: [req.user.id],
    })
    await team.save()
    res.status(201).json(team)
  } catch (error) {
    res.status(500).json({ message: "Failed to create team" })
  }
})

// Get user's teams
router.get("/", verifyToken, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    }).populate("owner members projects")
    res.json(teams)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch teams" })
  }
})

// Add member to team
router.post("/:id/members", verifyToken, async (req, res) => {
  try {
    const { userEmail } = req.body
    // In production, lookup user by email
    const team = await Team.findById(req.params.id)
    if (!team.members.includes(userEmail)) {
      team.members.push(userEmail)
      await team.save()
    }
    res.json(team)
  } catch (error) {
    res.status(500).json({ message: "Failed to add member" })
  }
})

// Get team details
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate("owner members projects")
    if (!team) return res.status(404).json({ message: "Team not found" })
    res.json(team)
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch team" })
  }
})

export default router
