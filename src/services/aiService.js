/**
 * AI Service for generating study materials using Google Gemini API
 * Implements 4-tier model fallback system with 4 API keys
 */

// Load all available API keys
const API_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
].filter((key) => key && key.trim() !== "");

// 4-tier model priority (best to fallback)
const MODELS = [
  "gemini-2.5-flash-lite", // Primary: Latest stable flash
  "gemini-2.5-flash", // Fallback 1: Standard flash
  "gemini-2.5-pro", // Fallback 2: Latest pro
  "gemini-2.0-flash", // Fallback 3: Legacy model
];

// Track current key and model indices
let currentKeyIndex = 0;
let currentModelIndex = 0;

/**
 * Get next API key and model combination
 * Cycles through all 4 models for each key before moving to next key
 */
function getNextKeyAndModel() {
  if (API_KEYS.length === 0) {
    throw new Error(
      "No Gemini API keys configured. Please add your API keys to .env file."
    );
  }

  const apiKey = API_KEYS[currentKeyIndex];
  const model = MODELS[currentModelIndex];

  // Move to next model
  currentModelIndex++;

  // If we've tried all models for current key, move to next key
  if (currentModelIndex >= MODELS.length) {
    currentModelIndex = 0;
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  }

  return { apiKey, model };
}

/**
 * Call Gemini API with intelligent 4-tier model fallback and key rotation
 * Flow: Try all 4 models with API Key 1 → All 4 models with Key 2 → Key 3 → Key 4
 */
async function callGemini(prompt, temperature = 0.7, qualityMode = "balanced") {
  if (API_KEYS.length === 0) {
    throw new Error(
      "Gemini API keys not configured. Please add your API keys to .env file."
    );
  }

  // Total combinations: 4 keys × 4 models = 16 attempts max
  const totalCombinations = API_KEYS.length * MODELS.length;
  let lastError = null;
  let attemptCount = 0;

  // Save initial indices to detect full cycle
  const startKeyIndex = currentKeyIndex;
  const startModelIndex = currentModelIndex;

  while (attemptCount < totalCombinations) {
    try {
      const { apiKey, model } = getNextKeyAndModel();
      attemptCount++;

      console.log(
        `Attempt ${attemptCount}/${totalCombinations}: Using ${model} with API Key ${
          currentKeyIndex + 1
        }`
      );

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: temperature,
            maxOutputTokens: 2048,
            topP: 0.95,
            topK: 40,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Check for rate limit (429) or quota exceeded (429/403)
        if (response.status === 429 || response.status === 403) {
          console.warn(
            `Rate limit/quota exceeded for ${model} (Key ${currentKeyIndex}). Trying next model...`
          );
          lastError = new Error(
            errorData.error?.message || `Rate limit: ${response.status}`
          );
          continue; // Try next model immediately
        }

        // Check for model unavailable errors
        if (response.status === 404 || response.status === 400) {
          console.warn(
            `Model ${model} unavailable or invalid. Trying next model...`
          );
          lastError = new Error(
            errorData.error?.message || `Model error: ${response.status}`
          );
          continue;
        }

        throw new Error(
          errorData.error?.message ||
            `API request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      // Extract text from Gemini response
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        console.log(`✓ Success with ${model} (Key ${currentKeyIndex})`);
        return data.candidates[0].content.parts[0].text;
      }

      // Handle blocked or empty responses
      if (data.candidates?.[0]?.finishReason === "SAFETY") {
        throw new Error("Content blocked by safety filters");
      }

      throw new Error("Invalid response format from Gemini API");
    } catch (error) {
      lastError = error;

      // If it's a rate limit or quota error, continue immediately to next model
      if (
        error.message?.includes("429") ||
        error.message?.includes("quota") ||
        error.message?.includes("rate limit")
      ) {
        continue;
      }

      // For other errors, add small delay before retry
      if (attemptCount < totalCombinations) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // All combinations exhausted
  throw (
    lastError ||
    new Error(
      `All ${totalCombinations} API key/model combinations exhausted. Please wait before retrying.`
    )
  );
}

/**
 * System instruction for all prompts
 */
const SYSTEM_INSTRUCTION =
  "You are a helpful study assistant that condenses content for college students.\n\n";

/**
 * Generate chunk summary
 */
export async function generateChunkSummary(chunkText) {
  const prompt = `${SYSTEM_INSTRUCTION}Summarize the following text into 5-10 concise bullet points, one sentence each.
Output only bullet points.

Text:
${chunkText}`;

  return await callGemini(prompt);
}

/**
 * Synthesize multiple chunk summaries into one cohesive summary
 * Creates detailed prose-style notes like ChatGPT
 */
export async function synthesizeSummaries(chunkSummaries) {
  const prompt = `${SYSTEM_INSTRUCTION}You are an expert study notes creator. Analyze the content and write comprehensive, well-structured study notes in a natural, flowing paragraph format (like ChatGPT).

Write detailed notes covering ALL topics with the following structure for EACH topic:

**[Topic Name from content]**

Begin with a clear introduction explaining the topic in 3-4 sentences. Then provide detailed explanations in natural paragraph form.

**Key Concepts:** Write 2-3 paragraphs explaining the main concepts, theories, and principles. Use natural language, not bullet points.

**Formulas and Equations:** If formulas are present in the content, explain them in detail with proper notation. For example: "The fundamental equation is F = ma, where F represents force in Newtons, m is mass in kilograms, and a is acceleration in meters per second squared." If the content lacks important formulas that are essential to the topic, you may add standard formulas with clear explanations.

**Constants and Values:** Mention all numerical values, constants, and measurements from the content. If standard constants are needed but not in the content (like g = 9.8 m/s², c = 3×10⁸ m/s, π = 3.14159), you may include them with explanations.

**Derivations:** If derivations are shown in the content, explain them step-by-step in paragraph form, showing the logical progression.

**Worked Examples:** Present any numerical problems from the content with complete solutions. Write as: "Consider an example where... Given that... we can calculate... Following these steps: First,... Second,... Therefore, the final answer is..."

**Applications:** Describe practical applications and real-world relevance in 2-3 sentences.

---

IMPORTANT INSTRUCTIONS:
- Write in flowing paragraphs, NOT bullet points
- Use natural, conversational language like explaining to a student
- Extract all content from the material first
- Add missing essential formulas, constants only if they enhance understanding
- Make it comprehensive yet readable
- Include all numerical examples and calculations from content
- Use proper mathematical notation
- Generate extensive notes (aim for 1000-3000 words depending on content)

Chunk summaries:
${chunkSummaries.join("\n\n---\n\n")}`;

  return await callGemini(prompt, 0.7);
}

/**
 * Extract key points from text
 */
export async function extractKeyPoints(text) {
  const prompt = `${SYSTEM_INSTRUCTION}From the following text, extract ALL essential key points that a student must remember.
Each key point should be clear and actionable.

Generate AS MANY key points AS NEEDED based on content length:
- For short content: 8-12 points
- For medium content (standard chapter): 15-25 points
- For long content (detailed chapters): 25-40+ points

Do NOT limit yourself to a fixed number. Extract EVERY important concept, definition, formula, and fact.
Output as bullet points covering all major concepts comprehensively.

Text:
${text}`;

  return await callGemini(prompt);
}

/**
 * Generate flashcards from summary
 */
export async function generateFlashcards(summaryText) {
  // Calculate target number based on content length
  const wordCount = summaryText.split(/\s+/).length;
  let targetCount;
  if (wordCount < 200) {
    targetCount = 5; // Very short content
  } else if (wordCount < 500) {
    targetCount = 10; // Short content
  } else if (wordCount < 1000) {
    targetCount = 15; // Medium content
  } else if (wordCount < 2000) {
    targetCount = 20; // Long content
  } else {
    targetCount = 30; // Very long content
  }

  const prompt = `${SYSTEM_INSTRUCTION}Analyze the material and create diverse flashcards covering ALL content.

Generate EXACTLY ${targetCount} flashcards based on the content (minimum 5, maximum 30 based on content length).

ANALYZE the content and create appropriate question types based on what's present:

**IF content has THEORY/CONCEPTS:**
- Definition questions from content
- Explanation questions based on material
- Application questions using content examples
- Comparison questions between concepts in material
- Analytical questions about material

**IF content has FORMULAS:**
- Formula recall from content
- Variable identification from formulas in content
- Formula application questions

**IF content has NUMERICAL VALUES/CONSTANTS:**
- Value recall from content
- Unit-related questions from content

**IF content has WORKED EXAMPLES/PROBLEMS:**
- Create calculation questions using data from content
- Create similar problems using values from content
- Step-by-step solution questions

**IF content has DERIVATIONS:**
- Derivation step questions from content

For numerical questions:
- Use ONLY data, values, and examples from the provided content
- Extract numerical problems from the material
- Create similar questions using values/scenarios from content
- Show step-by-step solutions
- Include units as used in content

CRITICAL RULES:
- Base ALL questions on the provided material ONLY
- Extract formulas, values, and problems from content
- Do NOT create questions with external examples or data
- Match question types to content type (theory-heavy vs numerical-heavy)
- If content has 70% theory, make 70% theory questions
- If content has 50% numerical, make 50% numerical questions

Output in JSON format:
[
  {"question": "...", "answer": "..."},
  {"question": "...", "answer": "..."}
]

Material:
${summaryText}`;

  const response = await callGemini(prompt, 0.8);

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON response");
  } catch (error) {
    console.error("Failed to parse flashcards:", error);
    // Fallback: parse manually
    return parseFlashcardsManually(response);
  }
}

/**
 * Generate practice questions (MCQ and MSQ) with answer validation
 */
export async function generatePracticeQuestions(summaryText) {
  // Calculate target number based on content length
  const wordCount = summaryText.split(/\s+/).length;
  let targetCount;
  if (wordCount < 400) {
    targetCount = 5; // Very short content
  } else if (wordCount < 1200) {
    targetCount = 10; // Short content
  } else if (wordCount < 1800) {
    targetCount = 15; // Medium content
  } else if (wordCount < 2500) {
    targetCount = 20; // Long content
  } else {
    targetCount = 25; // Very long content
  }

  const prompt = `${SYSTEM_INSTRUCTION}Create comprehensive MCQ (Multiple Choice Questions) based on the material. Generate EXACTLY ${targetCount} questions (minimum 5, maximum 30 based on content length).

**Question Types Based on Content:**

1. **Theory Questions** (from concepts in material):
   - Conceptual understanding
   - Definitions and explanations
   - Applications and comparisons
   - Analytical reasoning

2. **Numerical Questions** (from problems/formulas in material):
   - Calculations using formulas from content
   - Problem-solving with given values
   - Unit conversions (if in content)
   - Formula applications

**Question Format:**
- All questions are MCQ (Multiple Choice - ONLY ONE correct answer)
- Create 4 distinct options (A, B, C, D) for each question
- Only ONE option is correct

**Difficulty Levels:**
- Easy (basic recall) - 30%
- Medium (application) - 50%
- Hard (analysis/synthesis) - 20%

**IMPORTANT INSTRUCTIONS:**
- Base questions primarily on content from the material
- For numerical questions, if essential formulas are missing from content, you may add standard formulas (like F=ma, E=mc², etc.) with clear explanations
- Create 4 distinct options for each question
- Make incorrect options plausible (common mistakes, partial answers)
- Each question has EXACTLY ONE correct answer
- Provide detailed explanations showing:
  * Why the correct answer is right
  * Why incorrect options are wrong
  * Step-by-step calculations for numerical questions

**Validation Feature:**
Each question should be designed so students can verify their answer against the provided explanation and understand their mistakes.

Output in strict JSON format (MCQ ONLY):
[
  {
    "type": "mcq",
    "question": "What is the force when mass is 10kg and acceleration is 5m/s²?",
    "options": ["A) 50 N", "B) 15 N", "C) 2 N", "D) 100 N"],
    "correct": "A",
    "explanation": "Using F = ma: F = 10kg × 5m/s² = 50N. Option B (15N) would be m+a, Option C (2N) would be a/m, Option D (100N) is incorrect calculation."
  },
  {
    "type": "mcq",
    "question": "Which law states that force equals mass times acceleration?",
    "options": ["A) Newton's First Law", "B) Newton's Second Law", "C) Newton's Third Law", "D) Law of Conservation"],
    "correct": "B",
    "explanation": "Newton's Second Law states F=ma. First Law is about inertia, Third Law is action-reaction, and Conservation Law is different."
  },
  {
    "type": "mcq",
    "question": "...",
    "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
    "correct": "C",
    "explanation": "..."
  }
]

Material:
${summaryText}`;

  const response = await callGemini(prompt, 0.8);

  try {
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("Invalid JSON response");
  } catch (error) {
    console.error("Failed to parse questions:", error);
    return parseQuestionsManually(response);
  }
}

/**
 * Fallback parser for flashcards
 */
function parseFlashcardsManually(text) {
  const flashcards = [];
  const lines = text.split("\n").filter((line) => line.trim());

  let currentQ = null;
  for (const line of lines) {
    if (line.match(/^(Q|Question):/i)) {
      if (currentQ) flashcards.push(currentQ);
      currentQ = {
        question: line.replace(/^(Q|Question):/i, "").trim(),
        answer: "",
      };
    } else if (line.match(/^(A|Answer):/i) && currentQ) {
      currentQ.answer = line.replace(/^(A|Answer):/i, "").trim();
    }
  }
  if (currentQ && currentQ.answer) flashcards.push(currentQ);

  return flashcards.length > 0
    ? flashcards
    : [
        {
          question: "Sample Question",
          answer: "Sample Answer - Generation failed, please try again.",
        },
      ];
}

/**
 * Fallback parser for questions
 */
function parseQuestionsManually(text) {
  return [
    {
      type: "mcq",
      question: "Sample question - Generation failed, please try again.",
      options: ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      correct: "A",
      explanation: "Please regenerate questions.",
    },
  ];
}
