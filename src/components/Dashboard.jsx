import { useState, useEffect } from "react";
import {
  getCurrentUser,
  getQuizResults,
  deleteNoteFromHistory,
  clearHistory,
  debugQuizResults,
  resetNoteQuizData,
} from "../utils/storage";
import "./Dashboard.css";

export default function Dashboard({
  onClose,
  notesHistory,
  onNotesUpdate,
  onViewNote,
}) {
  const [userProfile, setUserProfile] = useState(null);
  const [stats, setStats] = useState({
    totalNotes: 0,
    totalFlashcards: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    totalMarks: 0,
    averageScore: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadUserProfile();
    debugQuizResults(); // Debug localStorage data
    calculateStats();
  }, []); // Calculate on mount only, fresh data from localStorage each time

  const loadUserProfile = () => {
    const user = getCurrentUser();
    if (user) {
      setUserProfile(user);
    }
  };

  const calculateStats = () => {
    const quizResults = getQuizResults();
    const notesList = notesHistory || [];

    console.log("=== DASHBOARD CALCULATING STATS ===");
    console.log("Quiz Results Array:", quizResults);
    console.log("Quiz Results Length:", quizResults.length);
    console.log("Notes List:", notesList);
    console.log("Notes List Length:", notesList.length);

    // Calculate totals
    const totalNotes = notesList.length;
    const totalFlashcards = notesList.reduce(
      (sum, note) => sum + (note.flashcards?.length || 0),
      0
    );
    const totalQuestions = notesList.reduce(
      (sum, note) => sum + (note.questions?.length || 0),
      0
    );

    // Calculate quiz statistics with new scoring system
    let totalScore = 0;
    let questionsAttempted = 0;
    let correctQuestions = 0;
    let incorrectQuestions = 0;

    quizResults.forEach((result) => {
      totalScore += result.score || 0;
      questionsAttempted++;
      if (result.isCorrect) {
        correctQuestions++;
      } else {
        incorrectQuestions++;
      }
    });

    // Calculate percentage based on normalized score
    // Score range: -questionsAttempted (all wrong) to +questionsAttempted (all correct)
    // Normalize to 0-100 scale:
    // - All wrong (-questionsAttempted) = 0%
    // - All correct (+questionsAttempted) = 100%
    // - Half right, half wrong (0) = 50%
    const averageScore =
      questionsAttempted > 0
        ? parseFloat(
            (
              ((totalScore + questionsAttempted) / (2 * questionsAttempted)) *
              100
            ).toFixed(1)
          )
        : 0;

    const calculatedStats = {
      totalNotes,
      totalFlashcards,
      totalQuestions,
      correctAnswers: correctQuestions,
      incorrectAnswers: incorrectQuestions,
      totalMarks: totalScore,
      averageScore,
      questionsAttempted,
    };
    console.log("=== CALCULATED STATS ===");
    console.log("Total Score:", totalScore);
    console.log("Questions Attempted:", questionsAttempted);
    console.log("Max Possible Score:", questionsAttempted);
    console.log("Average Score (%):", averageScore);
    console.log("Stats Object:", calculatedStats);
    console.log("=========================");
    setStats(calculatedStats);

    // Recent activity
    const recent = notesList
      .slice(-5)
      .reverse()
      .map((note) => ({
        title: note.title || "Untitled",
        subject: note.subject || "General",
        date: note.timestamp,
        flashcards: note.flashcards?.length || 0,
        questions: note.questions?.length || 0,
      }));
    setRecentActivity(recent);
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getPerformanceLevel = (score) => {
    if (score >= 80) return { label: "Excellent", color: "#10b981" };
    if (score >= 60) return { label: "Good", color: "#3b82f6" };
    if (score >= 40) return { label: "Average", color: "#f59e0b" };
    return { label: "Needs Improvement", color: "#ef4444" };
  };

  const handleDeleteNote = (noteId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this note? This will also delete all quiz results and progress for this note."
      )
    ) {
      console.log("Deleting note and all related data:", noteId);
      deleteNoteFromHistory(noteId);

      // Force immediate stats recalculation with fresh data
      const freshQuizResults = getQuizResults();
      console.log("Quiz results after deletion:", freshQuizResults.length);

      // Trigger parent update first, then recalculate
      if (onNotesUpdate) {
        onNotesUpdate(); // Refresh the notes list
      }

      // Small delay to ensure data is updated
      setTimeout(() => {
        calculateStats();
      }, 50);
    }
  };

  const handleResetNote = (noteId) => {
    if (
      window.confirm(
        "Are you sure you want to reset all quiz attempts for this note? This will clear all your answers and scores, allowing you to attempt the questions again."
      )
    ) {
      console.log("Resetting quiz data for note:", noteId);
      resetNoteQuizData(noteId);

      // Force immediate stats recalculation with fresh data
      const freshQuizResults = getQuizResults();
      console.log("Quiz results after reset:", freshQuizResults.length);

      // Recalculate stats immediately
      setTimeout(() => {
        calculateStats();
      }, 50);
    }
  };

  const handleViewNote = (note) => {
    // Pass the note to parent to show in OutputScreen
    if (onViewNote) {
      onViewNote(note);
    }
  };

  const getNotePerformance = (noteId) => {
    const quizResults = getQuizResults();
    const noteResults = quizResults.filter(
      (result) => result.noteId === noteId
    );

    if (noteResults.length === 0) {
      return null;
    }

    let totalScore = 0;
    let questionsAttempted = noteResults.length;
    let correctCount = 0;

    noteResults.forEach((result) => {
      totalScore += result.score || 0;
      if (result.isCorrect) {
        correctCount++;
      }
    });

    // Normalize score from -questionsAttempted to +questionsAttempted range to 0-100%
    const percentage =
      questionsAttempted > 0
        ? parseFloat(
            (
              ((totalScore + questionsAttempted) / (2 * questionsAttempted)) *
              100
            ).toFixed(1)
          )
        : 0;

    return {
      score: totalScore,
      attempted: questionsAttempted,
      correct: correctCount,
      percentage,
    };
  };

  const clearAllData = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all progress data and notes? This will delete all notes, quiz results, and quiz progress. This cannot be undone."
      )
    ) {
      console.log("Clearing all data: notes, quiz results, and quiz progress");
      clearHistory();

      // Verify data is cleared
      const freshQuizResults = getQuizResults();
      console.log("Quiz results after clear:", freshQuizResults.length);

      if (onNotesUpdate) {
        onNotesUpdate();
      }

      // Small delay to ensure data is updated
      setTimeout(() => {
        calculateStats();
      }, 50);
    }
  };

  const performance = getPerformanceLevel(stats.averageScore);

  return (
    <div className="dashboard-overlay">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>My Dashboard</h1>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dashboard-content">
          {/* User Profile Section */}
          {userProfile && (
            <div className="profile-section">
              <div className="profile-display">
                <div className="profile-avatar">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                  <h3>{userProfile.name}</h3>
                  <p>{userProfile.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h4>Total Notes</h4>
                <p className="stat-number">{stats.totalNotes}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎴</div>
              <div className="stat-content">
                <h4>Flashcards</h4>
                <p className="stat-number">{stats.totalFlashcards}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">❓</div>
              <div className="stat-content">
                <h4>Questions</h4>
                <p className="stat-number">{stats.totalQuestions}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h4>Correct Answers</h4>
                <p className="stat-number">{stats.correctAnswers}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">❌</div>
              <div className="stat-content">
                <h4>Incorrect Answers</h4>
                <p className="stat-number">{stats.incorrectAnswers}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h4>Total Marks</h4>
                <p className="stat-number">{stats.totalMarks}</p>
              </div>
            </div>
          </div>

          {/* Performance Section */}
          <div className="performance-section">
            <h3> Overall Performance</h3>
            <div className="performance-card">
              <div className="performance-score">
                <div
                  className="score-circle"
                  style={{
                    background: `conic-gradient(${performance.color} ${
                      (parseFloat(stats.averageScore) || 0) * 3.6
                    }deg, rgba(30, 30, 50, 0.8) 0deg)`,
                  }}
                >
                  <div className="score-inner">
                    <span className="score-value">{stats.averageScore}%</span>
                  </div>
                </div>
                <p
                  className="performance-label"
                  style={{ color: performance.color }}
                >
                  {performance.label}
                </p>
              </div>
              <div className="performance-breakdown">
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Score:</span>
                  <span
                    className={`breakdown-value ${
                      stats.totalMarks >= 0
                        ? "positive-score"
                        : "negative-score"
                    }`}
                  >
                    {stats.totalMarks > 0 ? "+" : ""}
                    {stats.totalMarks}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Correct:</span>
                  <span className="breakdown-value correct">
                    {stats.correctAnswers}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Incorrect:</span>
                  <span className="breakdown-value incorrect">
                    {stats.incorrectAnswers}
                  </span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Total Attempted:</span>
                  <span className="breakdown-value">
                    {stats.questionsAttempted || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Notes/Chapters */}
          {notesHistory && notesHistory.length > 0 && (
            <div className="notes-history-section">
              <h3> Saved Notes</h3>
              <div className="notes-list">
                {notesHistory.map((note) => {
                  const notePerf = getNotePerformance(note.id);
                  return (
                    <div key={note.id} className="note-card-history">
                      <div className="note-card-header">
                        <div
                          className="note-header-clickable"
                          onClick={() => handleViewNote(note)}
                          style={{ cursor: "pointer", flex: 1 }}
                        >
                          <h4>{note.title}</h4>
                          <p className="note-meta">
                            <span className="note-subject">{note.subject}</span>
                            <span className="note-date">
                              {formatDate(note.createdAt)}
                            </span>
                          </p>
                        </div>
                        <div className="note-action-buttons">
                          <button
                            className="reset-note-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetNote(note.id);
                            }}
                            title="Reset quiz attempts for this note"
                          >
                            Reset
                          </button>
                          <button
                            className="delete-note-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            title="Delete this note"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div
                        className="note-stats"
                        onClick={() => handleViewNote(note)}
                        style={{ cursor: "pointer" }}
                      >
                        <span>
                          📝{" "}
                          {(note.summary || note.notes || "")
                            .split("\n\n")
                            .filter((s) => s.trim()).length || 0}{" "}
                          sections
                        </span>
                        <span>
                          🎴 {note.flashcards?.length || 0} flashcards
                        </span>
                        <span>❓ {note.questions?.length || 0} questions</span>
                      </div>
                      {notePerf && (
                        <div className="note-performance">
                          <div className="note-perf-header">
                            <div
                              className="note-score-circle"
                              style={{
                                background: `conic-gradient(${
                                  notePerf.percentage >= 60
                                    ? "#10b981"
                                    : notePerf.percentage >= 40
                                    ? "#f59e0b"
                                    : "#ef4444"
                                } ${
                                  (parseFloat(notePerf.percentage) || 0) * 3.6
                                }deg, rgba(30, 30, 50, 0.8) 0deg)`,
                              }}
                            >
                              <div className="note-score-inner">
                                <span className="note-score-value">
                                  {notePerf.percentage}%
                                </span>
                              </div>
                            </div>
                            <div className="note-perf-stats">
                              <span className="perf-item">
                                <span className="perf-label">Score:</span>
                                <span
                                  className={`perf-value ${
                                    notePerf.score >= 0
                                      ? "positive"
                                      : "negative"
                                  }`}
                                >
                                  {notePerf.score > 0 ? "+" : ""}
                                  {notePerf.score}
                                </span>
                              </span>
                              <span className="perf-item">
                                <span className="perf-label">Attempted:</span>
                                <span className="perf-value">
                                  {notePerf.attempted}
                                </span>
                              </span>
                              <span className="perf-item">
                                <span className="perf-label">Correct:</span>
                                <span className="perf-value correct">
                                  {notePerf.correct}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {note.sourceFile && (
                        <p className="note-source">📎 {note.sourceFile}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="dashboard-actions">
            <button onClick={clearAllData} className="clear-data-btn">
              Clear Progress Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
