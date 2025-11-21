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

// -------------------------
// CORS SETUP (Render Friendly)
// -------------------------
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

app.use(express.json())

// -------------------------
// MONGO CONNECTION (Render Safe)
// -------------------------
const mongoURI = process.env.MONGODB_URI

if (!mongoURI) {
  console.error("❌ ERROR: MONGODB_URI missing in environment variables!")
  process.exit(1)
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
    process.exit(1)
  })

// -------------------------
// ROUTES
// -------------------------
app.get("/", (req, res) => {
  res.send("🚀 CodeCollab Backend is Running!")
})

app.use("/api/auth", authRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/code", codeRoutes)
app.use("/api/issues", issueRoutes)
app.use("/api/comments", commentRoutes)

// -------------------------
// SOCKET.IO SETUP
// -------------------------
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
})

const activeEditors = {}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-project", (projectId, userName) => {
    socket.join(projectId)
    activeEditors[projectId] = {
      ...activeEditors[projectId],
      [socket.id]: userName,
    }

    const uniqueUsers = [...new Set(Object.values(activeEditors[projectId]))]
    io.to(projectId).emit("active-users", uniqueUsers)
    socket.to(projectId).emit("user-joined", userName)
  })

  socket.on("code-change", (projectId, content) => {
    socket.to(projectId).emit("code-updated", content)
  })

  socket.on("file-updated", (projectId, fileName, content) => {
    socket.to(projectId).emit("file-updated", fileName, content)
  })

  socket.on("issue-update", (projectId, issueId, data) => {
    socket.to(projectId).emit("issue-changed", { issueId, ...data })
  })

  socket.on("leave-project", (projectId) => {
    if (activeEditors[projectId]) {
      delete activeEditors[projectId][socket.id]
      const uniqueUsers = [...new Set(Object.values(activeEditors[projectId]))]
      io.to(projectId).emit("active-users", uniqueUsers)
    }
    socket.leave(projectId)
  })

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id)

    for (const projectId in activeEditors) {
      if (activeEditors[projectId][socket.id]) {
        delete activeEditors[projectId][socket.id]
        const uniqueUsers = [...new Set(Object.values(activeEditors[projectId]))]
        io.to(projectId).emit("active-users", uniqueUsers)
      }
    }
  })
})

// -------------------------
// START SERVER
// -------------------------
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})

export default server
