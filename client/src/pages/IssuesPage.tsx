"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Plus, Tag, AlertCircle, CheckCircle, Clock } from "lucide-react"

interface Issue {
  _id: string
  title: string
  description: string
  status: "open" | "in-progress" | "resolved" | "closed"
  priority: "low" | "medium" | "high" | "critical"
  creator: { name: string }
  assignee?: { name: string }
  stamps: Array<{ label: string; color: string }>
  createdAt: string
}

const priorityColors = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  critical: "bg-red-100 text-red-800",
}

const statusIcons = {
  open: AlertCircle,
  "in-progress": Clock,
  resolved: CheckCircle,
  closed: CheckCircle,
}

export default function IssuesPage() {
  const { projectId } = useParams()
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [stampLabel, setStampLabel] = useState("")
  const [stampColor, setStampColor] = useState("blue")
  const { token } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchIssues()
  }, [projectId])

  const fetchIssues = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/issues/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setIssues(data)
      setLoading(false)
    } catch (error) {
      toast.error("Failed to load issues")
      setLoading(false)
    }
  }

  const createIssue = async () => {
    if (!title.trim()) {
      toast.error("Issue title required")
      return
    }

    try {
      const response = await fetch("http://localhost:5000/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          title,
          description,
          priority,
        }),
      })
      const newIssue = await response.json()
      setIssues([newIssue, ...issues])
      setTitle("")
      setDescription("")
      setPriority("medium")
      setShowModal(false)
      toast.success("Issue created")
    } catch (error) {
      toast.error("Failed to create issue")
    }
  }

  const updateStatus = async (issueId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const updated = await response.json()
      setIssues(issues.map((i) => (i._id === issueId ? updated : i)))
      toast.success("Issue updated")
    } catch (error) {
      toast.error("Failed to update issue")
    }
  }

  const addStamp = async (issueId: string) => {
    if (!stampLabel.trim()) {
      toast.error("Stamp label required")
      return
    }

    try {
      const response = await fetch(`http://localhost:5000/api/issues/${issueId}/stamps`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label: stampLabel, color: stampColor }),
      })
      const updated = await response.json()
      setIssues(issues.map((i) => (i._id === issueId ? updated : i)))
      setStampLabel("")
      setStampColor("blue")
      setSelectedIssue(null)
      toast.success("Stamp added")
    } catch (error) {
      toast.error("Failed to add stamp")
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading issues...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/project/${projectId}`)} className="text-gray-600 hover:text-gray-900">
              ← Back to Editor
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Issues & Bug Tracking</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            New Issue
          </button>
        </div>
      </div>

      {/* Issues List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {issues.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No issues yet. Keep the code clean!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.map((issue) => {
              const StatusIcon = statusIcons[issue.status]
              return (
                <div
                  key={issue._id}
                  className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <StatusIcon className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-bold text-gray-900">{issue.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[issue.priority]}`}
                        >
                          {issue.priority}
                        </span>
                      </div>
                      {issue.description && <p className="text-gray-600 mb-3">{issue.description}</p>}

                      {/* Stamps */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {issue.stamps.map((stamp, idx) => (
                          <span
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-medium bg-${stamp.color}-100 text-${stamp.color}-800`}
                          >
                            {stamp.label}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>by {issue.creator.name}</span>
                        {issue.assignee && <span>assigned to {issue.assignee.name}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <select
                        value={issue.status}
                        onChange={(e) => updateStatus(issue._id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition"
                      >
                        <Tag className="w-4 h-4" />
                        Add Stamp
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Issue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Issue</h2>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={createIssue}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Stamp Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Stamp to Issue</h2>
            <p className="text-gray-600 mb-4">{selectedIssue.title}</p>
            <input
              type="text"
              value={stampLabel}
              onChange={(e) => setStampLabel(e.target.value)}
              placeholder="Stamp label (e.g., 'bug', 'feature')"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={stampColor}
              onChange={(e) => setStampColor(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="red">Red</option>
              <option value="blue">Blue</option>
              <option value="green">Green</option>
              <option value="yellow">Yellow</option>
              <option value="purple">Purple</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedIssue(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => addStamp(selectedIssue._id)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
              >
                Add Stamp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
