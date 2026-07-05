"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import toast from "react-hot-toast"
import { Mail, Lock, LogIn, X, User, UserPlus, ShieldAlert, Terminal, HelpCircle } from "lucide-react"

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  
  const modalRef = useRef<HTMLDivElement>(null)

  // Clear fields gracefully when swapping execution modes
  useEffect(() => {
    setName("")
    setEmail("")
    setPassword("")
  }, [isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isLogin) {
        await login(email, password)
        toast.success("Logged in successfully.")
      } else {
        await register(name, email, password)
        toast.success("Registered successfully.")
      }
      onClose()
    } catch (error) {
      toast.error(isLogin ? "Login failed. Please check your credentials." : "Registration failed.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 14px 11px 38px",
    background: "#050505",
    border: "1px solid #1c1c1c",
    borderRadius: "6px",
    fontFamily: "JetBrains Mono, monospace",
    fontSize: "12px",
    color: "#e0e0e0",
    outline: "none",
    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(4, 4, 4, 0.85)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        animation: "fadeIn 0.2s ease"
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        .auth-input::placeholder { color: #333 !important; }
      `}</style>

      <div
        ref={modalRef}
        style={{
          background: "#0a0a0a",
          border: "1px solid #1c1c1c",
          borderRadius: "14px",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          boxShadow: "0 30px 60px -15px rgba(0,0,0,0.9), 0 0 50px 0 rgba(0,0,0,0.5)",
          animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Terminal Window Top Title Header Bar */}
        <div style={{
          background: "#060606",
          borderBottom: "1px solid #141414",
          height: "44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ 
              width: "9px", 
              height: "9px", 
              borderRadius: "50%", 
              background: loading ? "#eab308" : "#00e87a", 
              boxShadow: loading ? "0 0 8px #eab308" : "0 0 8px #00e87a",
              transition: "all 0.2s"
            }} />
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#555", fontWeight: 500 }}>
              
            </span>
          </div>
          
          <button
            onClick={onClose}
            style={{ 
              background: "none", 
              border: "none", 
              color: "#444", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              padding: "4px",
              transition: "color 0.15s" 
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}
          >
            <X size={15} />
          </button>
        </div>

        {/* Form Body Wrapper Layout */}
        <div style={{ padding: "32px 28px" }}>
          
          {/* Section Dynamic Heading Block */}
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div style={{ display: "inline-flex", background: "#050505", border: "1px solid #141414", padding: "10px", borderRadius: "8px", marginBottom: "12px" }}>
              {isLogin ? (
                <LogIn size={20} color="#00e87a" style={{ filter: "drop-shadow(0 0 4px rgba(0,232,122,0.2))" }} />
              ) : (
                <UserPlus size={20} color="#00e87a" style={{ filter: "drop-shadow(0 0 4px rgba(0,232,122,0.2))" }} />
              )}
            </div>
            
            <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "18px", fontWeight: 600, color: "#fff", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              {isLogin ? "Login" : "Register"}
            </h2>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555", margin: 0, lineHeight: "1.4" }}>
              {isLogin ? "Sign in to access your projects and collaborate." : "Create an account to start collaborating on projects."}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* FULL NAME OPTIONAL BLOCK FOR REGISTRATION FLOW */}
            {!isLogin && (
              <div style={{ animation: "fadeIn 0.2s ease-in-out" }}>
                <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Full Name
                </label>
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <User size={13} color="#444" style={{ position: "absolute", left: "14px", pointerEvents: "none" }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Jane Doe"
                    className="auth-input"
                    style={inputStyle}
                    onFocus={(e) => { e.target.style.borderColor = "#00e87a"; e.target.style.boxShadow = "0 0 15px -3px rgba(0,232,122,0.15)" }}
                    onBlur={(e) => { e.target.style.borderColor = "#1c1c1c"; e.target.style.boxShadow = "none" }}
                    required
                  />
                </div>
              </div>
            )}

            {/* EMAIL ACCESS KEY INPUT BLOCK */}
            <div>
              <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Email Address
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail size={13} color="#444" style={{ position: "absolute", left: "14px", pointerEvents: "none" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="auth-input"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#00e87a"; e.target.style.boxShadow = "0 0 15px -3px rgba(0,232,122,0.15)" }}
                  onBlur={(e) => { e.target.style.borderColor = "#1c1c1c"; e.target.style.boxShadow = "none" }}
                  required
                />
              </div>
            </div>

            {/* PASSWORD ACCESS KEY INPUT BLOCK */}
            <div>
              <label style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#555", display: "block", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Password
              </label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock size={13} color="#444" style={{ position: "absolute", left: "14px", pointerEvents: "none" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="auth-input"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "#00e87a"; e.target.style.boxShadow = "0 0 15px -3px rgba(0,232,122,0.15)" }}
                  onBlur={(e) => { e.target.style.borderColor = "#1c1c1c"; e.target.style.boxShadow = "none" }}
                  required
                />
              </div>
            </div>

            {/* SUBMISSION ACTION PIPELINE TRIGGER */}
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? "#07140c" : "#00e87a",
                border: "none",
                borderRadius: "6px",
                padding: "12px",
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "12px",
                fontWeight: 600,
                color: loading ? "#0f331b" : "#050505",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginTop: "8px",
                boxShadow: loading ? "none" : "0 4px 20px rgba(0, 232, 122, 0.15)"
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#1affaa"; e.currentTarget.style.boxShadow = "0 4px 25px rgba(0, 232, 122, 0.25)" } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#00e87a"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 232, 122, 0.15)" } }}
            >
              {loading ? (
                <>
                  <span style={{ animation: "blink .8s step-end infinite" }}>▋</span> 
                  {isLogin ? "Logging in..." : "Creating account..."}
                </>
              ) : (
                <>{isLogin ? "Login" : "Register"}</>
              )}
            </button>
          </form>

          {/* VIEW SYSTEM TARGET ALTERNATOR LAYER FOOTER */}
          <div style={{ marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #121212", textAlign: "center" }}>
            <p style={{ fontFamily: "Inter, sans-serif", fontSize: "12px", color: "#555", margin: 0 }}>
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#00e87a",
                  fontFamily: "JetBrains Mono, monospace",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: "2px 4px",
                  transition: "color 0.15s"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1affaa")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#00e87a")}
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}