import React from "react";
import "./LoadingScreen.css";

const STEPS = [
  {
    id: "analyzing",
    icon: "🔍",
    title: "Analyzing document",
    description: "Processing and understanding your content",
  },
  {
    id: "summary",
    icon: "📝",
    title: "Generating summary",
    description: "Creating concise bullet points",
  },
  {
    id: "flashcards",
    icon: "🎴",
    title: "Building flashcards",
    description: "Crafting Q&A study cards",
  },
  {
    id: "questions",
    icon: "❓",
    title: "Creating practice questions",
    description: "Generating MCQ and MSQ questions",
  },
];

function LoadingScreen({ currentStep = "analyzing" }) {
  const currentStepIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="loading-screen fade-in">
      <div className="loading-content">
        <h2>✨ Generating Your Study Materials</h2>

        <div className="spinner"></div>

        <div className="progress-steps">
          {STEPS.map((step, index) => {
            let className = "progress-step";
            if (index < currentStepIndex) className += " completed";
            if (index === currentStepIndex) className += " active";

            return (
              <div key={step.id} className={className}>
                <div className="step-icon">
                  {index < currentStepIndex ? "✅" : step.icon}
                </div>
                <div className="step-text">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="loading-tips">
          <h4>💡 Did you know?</h4>
          <p>
            Active recall through flashcards and practice questions is one of
            the most effective study methods. Studies show it improves retention
            by up to 50% compared to passive reading!
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;
