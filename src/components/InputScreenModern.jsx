import React, { useState, useRef } from "react";
import { extractTextFromFile } from "../utils/textProcessing";
import "./InputScreenModern.css";

const SUBJECTS = [
  { id: "cs", name: "Computer Science", icon: "💻", color: "#3b82f6" },
  { id: "math", name: "Mathematics", icon: "📐", color: "#8b5cf6" },
  { id: "physics", name: "Physics", icon: "⚛️", color: "#06b6d4" },
  { id: "chemistry", name: "Chemistry", icon: "🧪", color: "#10b981" },
  { id: "biology", name: "Biology", icon: "🧬", color: "#f59e0b" },
  { id: "history", name: "History", icon: "📜", color: "#ef4444" },
  { id: "economics", name: "Economics", icon: "💰", color: "#ec4899" },
  { id: "literature", name: "Literature", icon: "📚", color: "#6366f1" },
  { id: "other", name: "Other", icon: "📖", color: "#64748b" },
];

function InputScreenModern({
  onGenerate,
  onOpenDashboard,
  onSwitchUser,
  currentUser,
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [inputText, setInputText] = useState("");
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const fileInputRef = useRef(null);

  const handleFileChange = async (selectedFile) => {
    if (!selectedFile) return;
    setError("");
    const validTypes = [
      "text/plain",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Please upload a TXT, PDF, or DOCX file.");
      return;
    }
    setFile(selectedFile);
    setInputText("");
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileChange(droppedFile);
  };

  const handleSubmit = async () => {
    setError("");
    if (!inputText && !file) {
      setError("Please upload a file or paste some text");
      return;
    }
    if (!subject) {
      setError("Please select a subject");
      return;
    }
    try {
      let extractedText = file ? await extractTextFromFile(file) : inputText;
      if (!extractedText || extractedText.trim().length === 0) {
        setError("No text found. Please check your file or input.");
        return;
      }
      onGenerate({
        title: title || `${SUBJECTS.find((s) => s.id === subject)?.name} Notes`,
        subject: SUBJECTS.find((s) => s.id === subject)?.name,
        inputText: extractedText,
        sourceFile: file ? file.name : null,
      });
    } catch (err) {
      setError(err.message || "Failed to process file. Please try again.");
    }
  };

  return (
    <div className="modern-input-screen">
      <div className="bg-orb orb-1"></div>
      <div className="bg-orb orb-2"></div>
      <div className="bg-orb orb-3"></div>

      <nav className="modern-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="brand-text">NoteMaker AI</span>
          </div>
          <div className="nav-actions">
            {currentUser && (
              <button
                onClick={onSwitchUser}
                className="nav-user-btn"
                title="Switch User"
              >
                <div className="user-avatar-small">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <span className="user-name-nav">{currentUser.name}</span>
              </button>
            )}
            <button onClick={onOpenDashboard} className="nav-dashboard-btn">
              
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="hero-section">
        <div className="hero-badge">✨ Powered by Gemini AI</div>
        <h1 className="hero-title">
          Transform Your Study
          <br />
          <span className="gradient-text">Materials Instantly</span>
        </h1>
        <p className="hero-subtitle">
          Generate summaries, flashcards, and practice questions from any
          document
        </p>
      </div>

      <div className="content-container">
        <div className="input-tabs">
          <button
            className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
            onClick={() => setActiveTab("upload")}
          >
            <span>Upload File</span>
          </button>
          <button
            className={`tab-btn ${activeTab === "text" ? "active" : ""}`}
            onClick={() => setActiveTab("text")}
          >
            <span>Paste Text</span>
          </button>
        </div>

        <div className="input-area-container">
          {activeTab === "upload" ? (
            <div
              className={`upload-zone ${dragOver ? "drag-over" : ""} ${
                file ? "has-file" : ""
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                style={{ display: "none" }}
              />
              {!file ? (
                <>
                  <div className="upload-icon">📤</div>
                  <h3>Drop your file here</h3>
                  <p>or click to browse</p>
                  <div className="file-formats">
                    <span className="format-badge">PDF</span>
                    <span className="format-badge">DOCX</span>
                    <span className="format-badge">TXT</span>
                  </div>
                </>
              ) : (
                <div className="file-preview">
                  <div className="file-icon"></div>
                  <div className="file-info">
                    <h4>{file.name}</h4>
                    <p>{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <button
                    className="remove-file-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-input-zone">
              <textarea
                placeholder="Paste your lecture notes, chapter content, or study material here...&#10;&#10;💡 Tip: The more content you provide, the better the AI can generate comprehensive study materials!"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="modern-textarea"
              />
              <div className="textarea-footer">
                <span className="char-count">
                  {inputText.length} characters
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="modern-input-group">
          
          <input
            type="text"
            placeholder="Give your notes a title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modern-input"
          />
        </div>

        <div className="section-title">
          
          <span>Select Subject</span>
        </div>
        <div className="subject-grid">
          {SUBJECTS.map((subj) => (
            <button
              key={subj.id}
              className={`subject-card ${
                subject === subj.id ? "selected" : ""
              }`}
              onClick={() => setSubject(subj.id)}
              style={{ "--card-color": subj.color }}
            >
              <span className="subject-icon">{subj.icon}</span>
              <span className="subject-name">{subj.name}</span>
              {subject === subj.id && <span className="check-mark">✓</span>}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          className="generate-btn"
          onClick={handleSubmit}
          disabled={(!inputText && !file) || !subject}
        >
          <span className="btn-glow"></span>
          <span className="btn-content">
            <span className="btn-icon">✨</span>
            <span>Generate Study Materials</span>
            <span className="btn-arrow">→</span>
          </span>
        </button>
      </div>

      <div className="features-section">
        <div className="feature-card">
          <div className="feature-icon">🎴</div>
          <h3>Smart Flashcards</h3>
          <p>Interactive Q&A cards for active recall</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Key Summaries</h3>
          <p>Concise bullet-point summaries</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">❓</div>
          <h3>Practice Quiz</h3>
          <p>MCQ questions with explanations</p>
        </div>
      </div>
    </div>
  );
}

export default InputScreenModern;
