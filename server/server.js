import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import http from "http"
import { Server as SocketIOServer } from "socket.io"
import authRoutes from "./routes/auth.js"
import projectRoutes from "./routes/projects.js"
import codeRoutes from "./routes/code.js"
import issueRoutes from "./routes/issues.js"
import commentRoutes from "./routes/comments.js"

dotenv.config()
const app = express()
const server = http.createServer(app)
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  },
})

// Middleware
app.use(cors())
app.use(express.json())

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/collab-code")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB error:", err))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/code", codeRoutes)
app.use("/api/issues", issueRoutes)
app.use("/api/comments", commentRoutes)

// Socket.IO for Real-time Collaboration
const activeEditors = {}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join project room
  socket.on("join-project", (projectId, userName) => {
    socket.join(projectId)
    activeEditors[projectId] = { ...activeEditors[projectId], [socket.id]: userName }
    io.to(projectId).emit("active-users", Object.values(activeEditors[projectId] || {}))
    socket.to(projectId).emit("user-joined", userName)
  })

  // Code changes - real-time sync
  socket.on("code-change", (projectId, content) => {
    socket.to(projectId).emit("code-updated", content)
  })

  // Issue updates
  socket.on("issue-update", (projectId, issueId, data) => {
    socket.to(projectId).emit("issue-changed", { issueId, ...data })
  })

  // Leave project
  socket.on("leave-project", (projectId, userName) => {
    socket.leave(projectId)
    if (activeEditors[projectId]) {
      delete activeEditors[projectId][socket.id]
    }
    io.to(projectId).emit("active-users", Object.values(activeEditors[projectId] || {}))
    socket.to(projectId).emit("user-left", userName)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)
    // Clean up active editors on disconnect
    for (const projectId in activeEditors) {
      if (activeEditors[projectId][socket.id]) {
        const userName = activeEditors[projectId][socket.id]
        delete activeEditors[projectId][socket.id]
        io.to(projectId).emit("active-users", Object.values(activeEditors[projectId] || {}))
        socket.to(projectId).emit("user-left", userName)
      }
    }
  })
})

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

export default server
