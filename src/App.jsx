import React, { useState, useEffect } from "react";
import InputScreenModern from "./components/InputScreenModern";
import LoadingScreen from "./components/LoadingScreen";
import OutputScreen from "./components/OutputScreen";
import Dashboard from "./components/Dashboard";
import UserManagement from "./components/UserManagement";
import { chunkText, normalizeText, countWords } from "./utils/textProcessing";
import {
  generateChunkSummary,
  synthesizeSummaries,
  extractKeyPoints,
  generateFlashcards,
  generatePracticeQuestions,
} from "./services/aiService";
import {
  saveNoteToHistory,
  getNotesHistory,
  getCurrentUser,
  getAllUsers,
} from "./utils/storage";
import "./App.css";

function App() {
  const [screen, setScreen] = useState("input"); // 'input', 'loading', 'output', 'error', 'dashboard'
  const [currentStep, setCurrentStep] = useState("analyzing");
  const [notesData, setNotesData] = useState(null);
  const [error, setError] = useState(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewedFromDashboard, setViewedFromDashboard] = useState(false);

  useEffect(() => {
    // Check if user exists, if not show user management
    const user = getCurrentUser();
    const allUsers = getAllUsers();

    if (!user && allUsers.length === 0) {
      // No users exist, show user management to create first user
      setShowUserManagement(true);
    } else if (!user && allUsers.length > 0) {
      // Users exist but none selected, show user selector
      setShowUserManagement(true);
    } else {
      setCurrentUser(user);
    }
  }, []);

  /**
   * Main processing pipeline
   */
  const handleUserSelected = (user) => {
    setCurrentUser(user);
    setShowUserManagement(false);
  };

  const processInput = async (inputData) => {
    try {
      if (!currentUser) {
        setError("Please select a user first");
        setShowUserManagement(true);
        return;
      }

      setScreen("loading");
      setError(null);

      const { title, subject, inputText, depth, sourceFile } = inputData;

      // Step 1: Analyzing document
      setCurrentStep("analyzing");
      const normalizedText = normalizeText(inputText);
      const wordCount = countWords(normalizedText);

      // Determine if we need to chunk
      const chunks = chunkText(normalizedText, 1500, 25);
      console.log(`Processing ${chunks.length} chunks (${wordCount} words)`);

      let finalSummary;

      if (chunks.length === 1) {
        // Short text - direct summary
        setCurrentStep("summary");
        finalSummary = await generateChunkSummary(chunks[0]);
      } else {
        // Long text - chunk processing
        setCurrentStep("summary");

        // Process chunks in parallel (in batches to avoid rate limits)
        const chunkSummaries = [];
        const batchSize = 3;

        for (let i = 0; i < chunks.length; i += batchSize) {
          const batch = chunks.slice(i, i + batchSize);
          const batchResults = await Promise.all(
            batch.map((chunk) => generateChunkSummary(chunk))
          );
          chunkSummaries.push(...batchResults);

          // Small delay between batches
          if (i + batchSize < chunks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Synthesize chunk summaries
        finalSummary = await synthesizeSummaries(chunkSummaries, depth);
      }

      // Step 2: Extract key points
      setCurrentStep("summary");
      const keyPointsText = await extractKeyPoints(finalSummary);
      const keyPoints = keyPointsText
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => line.replace(/^[-•*]\s*/, "").trim())
        .filter((line) => line.length > 0);

      // Step 3: Generate flashcards
      setCurrentStep("flashcards");
      const flashcards = await generateFlashcards(finalSummary);

      // Step 4: Generate practice questions
      setCurrentStep("questions");
      const questions = await generatePracticeQuestions(finalSummary);

      // Prepare final notes data
      const finalNotesData = {
        title,
        subject,
        summary: finalSummary,
        keyPoints,
        flashcards,
        questions,
        rawText: normalizedText,
        sourceFile,
        wordCount,
        depth,
        createdAt: new Date().toISOString(),
      };

      // Save to history
      const savedNote = saveNoteToHistory(finalNotesData);
      setNotesData(savedNote);

      // Show output
      setScreen("output");
      setViewedFromDashboard(false); // New note, not from dashboard
    } catch (err) {
      console.error("Processing error:", err);
      setError(
        err.message ||
          "An error occurred while generating notes. Please try again."
      );
      setScreen("error");
    }
  };

  const handleBack = () => {
    if (viewedFromDashboard) {
      // Go back to dashboard if note was opened from there
      setShowDashboard(true);
      setScreen("input");
      setNotesData(null);
      setViewedFromDashboard(false);
    } else {
      // Go back to home page
      setScreen("input");
      setNotesData(null);
      setError(null);
    }
  };

  const handleRetry = () => {
    setScreen("input");
    setError(null);
  };

  return (
    <div className="app">
      {showUserManagement && (
        <UserManagement
          onUserSelected={handleUserSelected}
          onClose={currentUser ? () => setShowUserManagement(false) : null}
        />
      )}

      {screen === "input" && !showUserManagement && (
        <InputScreenModern
          onGenerate={processInput}
          onOpenDashboard={() => setShowDashboard(true)}
          onSwitchUser={() => setShowUserManagement(true)}
          currentUser={currentUser}
        />
      )}

      {screen === "loading" && <LoadingScreen currentStep={currentStep} />}

      {screen === "output" && notesData && (
        <OutputScreen notesData={notesData} onBack={handleBack} />
      )}

      {screen === "error" && (
        <div className="error-screen fade-in">
          <div className="error-content card">
            <div className="error-icon">⚠️</div>
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">{error}</p>
            <div className="error-actions">
              <button className="btn btn-primary" onClick={handleRetry}>
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <Dashboard
          onClose={() => setShowDashboard(false)}
          notesHistory={getNotesHistory()}
          onNotesUpdate={() => {
            // Force re-render to update notes list
            setShowDashboard(false);
            setTimeout(() => setShowDashboard(true), 0);
          }}
          onViewNote={(note) => {
            setNotesData(note);
            setShowDashboard(false);
            setScreen("output");
            setViewedFromDashboard(true); // Mark that note was opened from dashboard
          }}
        />
      )}
    </div>
  );
}

export default App;
