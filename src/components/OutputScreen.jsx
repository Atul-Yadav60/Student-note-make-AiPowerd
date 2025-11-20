import React, { useState, useEffect } from "react";
import { generatePDF, copyToClipboard } from "../utils/pdfGenerator";
import {
  saveQuizResult,
  getQuizProgress,
  saveQuizProgress,
} from "../utils/storage";
import "./OutputScreenModern.css";

function OutputScreen({ notesData, onBack }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [flippedCards, setFlippedCards] = useState(new Set());
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showAnswers, setShowAnswers] = useState({});
  const [questionScores, setQuestionScores] = useState({});
  const [allQuestionsChecked, setAllQuestionsChecked] = useState(false);

  // Load saved quiz progress when component mounts or noteData changes
  useEffect(() => {
    if (notesData?.id) {
      const savedProgress = getQuizProgress(notesData.id);
      if (savedProgress) {
        console.log("Loading saved quiz progress:", savedProgress);
        setSelectedAnswers(savedProgress.selectedAnswers || {});
        setShowAnswers(savedProgress.showAnswers || {});
        setQuestionScores(savedProgress.questionScores || {});
        setAllQuestionsChecked(savedProgress.allQuestionsChecked || false);
      }
    }
  }, [notesData?.id]);

  const {
    title,
    subject,
    summary,
    keyPoints,
    flashcards,
    questions,
    createdAt,
  } = notesData;

  const handleFlipCard = (index) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(index)) {
      newFlipped.delete(index);
    } else {
      newFlipped.add(index);
    }
    setFlippedCards(newFlipped);
  };

  const handleAnswerSelect = (questionIndex, option) => {
    // All questions are MCQ - single selection only
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: option,
    });
  };

  const handleShowAnswer = (questionIndex) => {
    const question = questions[questionIndex];
    const userAnswer = selectedAnswers[questionIndex];

    // All questions are MCQ: +1 for correct, -1 for wrong
    let score = 0;
    let isCorrect = false;

    if (userAnswer === question.correct) {
      score = 1;
      isCorrect = true;
    } else {
      score = -1;
      isCorrect = false;
    }

    // Save quiz result to user's data
    try {
      const quizResultData = {
        noteId: notesData.id,
        noteTitle: notesData.title,
        noteSubject: notesData.subject,
        questionIndex,
        questionType: question.type,
        question: question.question,
        userAnswer,
        correctAnswer: question.correct,
        isCorrect,
        score,
        timestamp: Date.now(),
      };
      console.log("Saving quiz result:", quizResultData);
      saveQuizResult(quizResultData);
      console.log("Quiz result saved successfully");
    } catch (error) {
      console.error("Error saving quiz result:", error);
    }

    const newShowAnswers = {
      ...showAnswers,
      [questionIndex]: true,
    };

    const newQuestionScores = {
      ...questionScores,
      [questionIndex]: score,
    };

    setShowAnswers(newShowAnswers);
    setQuestionScores(newQuestionScores);

    // Check if all questions have been answered
    const totalAnswered = Object.keys(newShowAnswers).length;
    const allChecked = totalAnswered === questions.length;
    setAllQuestionsChecked(allChecked);

    // Save progress to localStorage (include current selected answer)
    const updatedSelectedAnswers = {
      ...selectedAnswers,
      [questionIndex]: userAnswer,
    };
    saveQuizProgress(notesData.id, {
      selectedAnswers: updatedSelectedAnswers,
      showAnswers: newShowAnswers,
      questionScores: newQuestionScores,
      allQuestionsChecked: allChecked,
    });
    console.log("Quiz progress saved for note:", notesData.id);
  };

  const handleResetQuestions = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all answers? This will clear your progress."
      )
    ) {
      setSelectedAnswers({});
      setShowAnswers({});
      setQuestionScores({});
      setAllQuestionsChecked(false);

      // Clear saved progress
      saveQuizProgress(notesData.id, {
        selectedAnswers: {},
        showAnswers: {},
        questionScores: {},
        allQuestionsChecked: false,
      });
      console.log("Quiz progress reset for note:", notesData.id);
    }
  };

  const handleCopy = async (text) => {
    const success = await copyToClipboard(text);
    if (success) {
      alert("Copied to clipboard!");
    }
  };

  const handleDownloadPDF = () => {
    generatePDF(notesData);
  };

  const parseSummary = (summaryText) => {
    if (!summaryText) return [];
    return summaryText
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line) => line.length > 0);
  };

  const renderSummary = () => {
    if (!summary || summary.trim().length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <p>No summary available</p>
        </div>
      );
    }

    // Split by double newlines to get paragraphs/sections
    const sections = summary
      .split(/\n\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return (
      <div className="tab-content">
        <div className="section-card">
          <div className="section-header">
            <h2>Summary</h2>
            <button
              className="action-btn action-btn-outline"
              onClick={() => handleCopy(summary)}
            >
               Copy
            </button>
          </div>
          <div className="notes-prose">
            {sections.map((section, index) => {
              // Check if it's a heading (starts with ## or **Topic:**)
              if (
                section.startsWith("##") ||
                section.match(/^\*\*[^:]+:\*\*/)
              ) {
                const heading = section
                  .replace(/^##\s*/, "")
                  .replace(/^\*\*([^:]+):\*\*/, "$1");
                return (
                  <h3 key={index} className="section-heading">
                    {heading}
                  </h3>
                );
              }
              // Regular paragraph
              return (
                <p key={index} className="section-paragraph">
                  {section}
                </p>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderKeyPoints = () => {
    if (!keyPoints || keyPoints.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🎯</div>
          <p>No key points available</p>
        </div>
      );
    }

    return (
      <div className="tab-content">
        <div className="section-card">
          <div className="section-header">
            <h2>Key Points</h2>
            <button
              className="action-btn action-btn-outline"
              onClick={() => handleCopy(keyPoints.join("\n"))}
            >
               Copy
            </button>
          </div>
          <ul className="content-list">
            {keyPoints.map((point, index) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderFlashcards = () => {
    if (!flashcards || flashcards.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">🎴</div>
          <p>No flashcards available</p>
        </div>
      );
    }

    return (
      <div className="tab-content">
        <div className="section-card">
          <div className="section-header">
            <h2>Flashcards</h2>
            <p className="section-hint">Click on any card to flip it</p>
          </div>
          <div className="flashcards-grid">
            {flashcards.map((card, index) => (
              <div
                key={index}
                className={`flashcard ${
                  flippedCards.has(index) ? "flipped" : ""
                }`}
                onClick={() => handleFlipCard(index)}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <div className="flashcard-label">Question</div>
                    <div className="flashcard-text">{card.question}</div>
                  </div>
                  <div className="flashcard-back">
                    <div className="flashcard-label">Answer</div>
                    <div className="flashcard-text">{card.answer}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderQuestions = () => {
    if (!questions || questions.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-state-icon">❓</div>
          <p>No practice questions available</p>
        </div>
      );
    }

    return (
      <div className="tab-content">
        {allQuestionsChecked && (
          <div className="questions-header">
            <div className="questions-summary">
              <span> All questions answered!</span>
              <span className="total-score">
                Total Score:{" "}
                {Object.values(questionScores).reduce((a, b) => a + b, 0)}
              </span>
            </div>
            <button className="reset-btn" onClick={handleResetQuestions}>
              Reset Questions
            </button>
          </div>
        )}
        <div className="questions-list">
          {questions.map((question, qIndex) => {
            const userAnswer = selectedAnswers[qIndex];
            const isAnswered = showAnswers[qIndex];

            return (
              <div key={qIndex} className="question-card">
                <div className="question-header">
                  <div className="question-number">{qIndex + 1}</div>
                  <span className="question-type">
                    {question.type.toUpperCase()}
                  </span>
                </div>

                <div className="question-text">{question.question}</div>

                {question.options && (
                  <div className="options-list">
                    {question.options.map((option, oIndex) => {
                      const optionLetter =
                        option.match(/^([A-D])/)?.[1] ||
                        String.fromCharCode(65 + oIndex);
                      let optionClass = "option";

                      if (isAnswered) {
                        if (optionLetter === question.correct) {
                          optionClass += " correct";
                        } else if (userAnswer === optionLetter) {
                          optionClass += " incorrect";
                        }
                      } else if (userAnswer === optionLetter) {
                        optionClass += " selected";
                      }

                      return (
                        <div
                          key={oIndex}
                          className={optionClass}
                          onClick={() =>
                            !isAnswered &&
                            handleAnswerSelect(qIndex, optionLetter)
                          }
                        >
                          {option}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="question-footer">
                  {!isAnswered ? (
                    <button
                      className="check-btn"
                      onClick={() => handleShowAnswer(qIndex)}
                      disabled={!userAnswer}
                    >
                      Check Answer
                    </button>
                  ) : (
                    <>
                      <div className="answer-result-container">
                        <div className="correct-answer">
                          ✓ Correct Answer: {question.correct}
                        </div>
                        <div
                          className={`question-score ${
                            questionScores[qIndex] >= 0
                              ? "positive"
                              : "negative"
                          }`}
                        >
                          Score: {questionScores[qIndex] > 0 ? "+" : ""}
                          {questionScores[qIndex]}
                        </div>
                      </div>
                      {question.explanation && (
                        <div className="explanation">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="output-screen">
      <div className="output-container">
        <div className="output-header">
          <div className="output-header-left">
            <h1>{title}</h1>
            <div className="output-meta">
              <div className="output-meta-item">
                <span>📚</span>
                <span>{subject}</span>
              </div>
              {createdAt && (
                <div className="output-meta-item">
                  <span>📅</span>
                  <span>{new Date(createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          <div className="output-actions">
            <button className="action-btn action-btn-outline" onClick={onBack}>
              ← Back
            </button>
            <button
              className="action-btn action-btn-gradient"
              onClick={handleDownloadPDF}
            >
               Download PDF
            </button>
          </div>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === "summary" ? "active" : ""}`}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </button>
            <button
              className={`tab-btn ${activeTab === "keypoints" ? "active" : ""}`}
              onClick={() => setActiveTab("keypoints")}
            >
               Key Points
            </button>
            <button
              className={`tab-btn ${
                activeTab === "flashcards" ? "active" : ""
              }`}
              onClick={() => setActiveTab("flashcards")}
            >
              Flashcards
            </button>
            <button
              className={`tab-btn ${activeTab === "questions" ? "active" : ""}`}
              onClick={() => setActiveTab("questions")}
            >
              Practice Questions
            </button>
          </div>
        </div>

        {activeTab === "summary" && renderSummary()}
        {activeTab === "keypoints" && renderKeyPoints()}
        {activeTab === "flashcards" && renderFlashcards()}
        {activeTab === "questions" && renderQuestions()}
      </div>
    </div>
  );
}

export default OutputScreen;
