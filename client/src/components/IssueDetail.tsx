"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Send, MessageSquare } from "lucide-react"

interface Comment {
  _id: string
  author: { name: string; _id: string }
  content: string
  createdAt: string
}

interface Issue {
  _id: string
  title: string
  description: string
  status: string
  priority: string
  creator: { name: string }
  assignee?: { name: string }
  stamps: Array<{ label: string; color: string }>
}

interface IssueDetailProps {
  issue: Issue
  onClose: () => void
}

export default function IssueDetail({ issue, onClose }: IssueDetailProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    fetchComments()
  }, [issue._id])

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/comments/issue/${issue._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setComments(data)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load comments")
      setLoading(false)
    }
  }

  const addComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment cannot be empty")
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          issueId: issue._id,
          content: newComment,
        }),
      })
      const comment = await response.json()
      setComments([...comments, comment])
      setNewComment("")
      toast.success("Comment added")
    } catch (error) {
      toast.error("Failed to add comment")
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{issue.title}</h2>
              <p className="text-gray-600 mt-2">{issue.description}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
              ×
            </button>
          </div>

          {/* Issue Metadata */}
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-2 font-medium text-gray-900">{issue.status}</span>
            </div>
            <div>
              <span className="text-gray-600">Priority:</span>
              <span className="ml-2 font-medium text-gray-900">{issue.priority}</span>
            </div>
            <div>
              <span className="text-gray-600">Created by:</span>
              <span className="ml-2 font-medium text-gray-900">{issue.creator.name}</span>
            </div>
          </div>

          {/* Stamps */}
          {issue.stamps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {issue.stamps.map((stamp, idx) => (
                <span
                  key={idx}
                  className={`px-3 py-1 rounded-full text-xs font-medium bg-${stamp.color}-100 text-${stamp.color}-800`}
                >
                  {stamp.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-gray-600">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-gray-600 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              No comments yet. Be the first to discuss!
            </p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <p className="font-medium text-gray-900">{comment.author.name}</p>
                    <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 mt-2">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex gap-3">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addComment()}
              placeholder="Add a comment to discuss this issue..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={addComment}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
