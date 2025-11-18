import jwt from "jsonwebtoken"

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]
  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret")
    req.user = { id: decoded.userId }
    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
}

export default verifyToken
