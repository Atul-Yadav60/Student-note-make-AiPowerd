/**
 * Local storage utilities for multi-user data and history
 * Supports multiple users without authentication
 */

const STORAGE_KEYS = {
  USERS_LIST: "student_notes_users",
  CURRENT_USER: "student_notes_current_user",
  USER_PREFIX: "student_notes_user_",
};

/**
 * Get all users
 */
export function getAllUsers() {
  const data = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
  return data ? JSON.parse(data) : [];
}

/**
 * Create a new user
 */
export function createUser(name, email) {
  const users = getAllUsers();

  // Check if email already exists
  if (users.find((u) => u.email === email)) {
    throw new Error("User with this email already exists");
  }

  const newUser = {
    id: Date.now(),
    name,
    email,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));

  // Initialize user data
  const userData = {
    profile: newUser,
    notes: [],
    quizResults: [],
    settings: {
      defaultDepth: "medium",
      preferredLanguage: "english",
      defaultFormat: "bullets",
    },
  };

  localStorage.setItem(
    `${STORAGE_KEYS.USER_PREFIX}${newUser.id}`,
    JSON.stringify(userData)
  );

  return newUser;
}

/**
 * Get current active user
 */
export function getCurrentUser() {
  const userId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (!userId) return null;

  const users = getAllUsers();
  return users.find((u) => u.id === parseInt(userId)) || null;
}

/**
 * Switch to a different user
 */
export function switchUser(userId) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, userId.toString());
}

/**
 * Get user profile (legacy support)
 */
export function getUserProfile() {
  const currentUser = getCurrentUser();
  return currentUser;
}

/**
 * Save user profile (legacy support)
 */
export function saveUserProfile(profile) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const users = getAllUsers();
  const userIndex = users.findIndex((u) => u.id === currentUser.id);
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...profile };
    localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
  }

  const userData = getUserData(currentUser.id);
  userData.profile = { ...userData.profile, ...profile };
  saveUserData(currentUser.id, userData);
}

/**
 * Get all data for a specific user
 */
export function getUserData(userId) {
  const data = localStorage.getItem(`${STORAGE_KEYS.USER_PREFIX}${userId}`);
  return data
    ? JSON.parse(data)
    : {
        profile: null,
        notes: [],
        quizResults: [],
        settings: {
          defaultDepth: "medium",
          preferredLanguage: "english",
          defaultFormat: "bullets",
        },
      };
}

/**
 * Save all data for a specific user
 */
export function saveUserData(userId, userData) {
  localStorage.setItem(
    `${STORAGE_KEYS.USER_PREFIX}${userId}`,
    JSON.stringify(userData)
  );
}

/**
 * Delete a user and all their data
 */
export function deleteUser(userId) {
  const users = getAllUsers();
  const filtered = users.filter((u) => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(filtered));
  localStorage.removeItem(`${STORAGE_KEYS.USER_PREFIX}${userId}`);

  // If deleted user was current, clear current user
  const currentUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (currentUserId === userId.toString()) {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

/**
 * Get notes history for current user
 */
export function getNotesHistory() {
  const currentUser = getCurrentUser();
  if (!currentUser) return [];

  const userData = getUserData(currentUser.id);
  return userData.notes || [];
}

/**
 * Save a note to history for current user
 */
export function saveNoteToHistory(note) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    throw new Error("No user selected. Please create or select a user first.");
  }

  const userData = getUserData(currentUser.id);
  const noteWithTimestamp = {
    ...note,
    id: Date.now(),
    userId: currentUser.id,
    createdAt: new Date().toISOString(),
  };

  userData.notes = userData.notes || [];
  userData.notes.unshift(noteWithTimestamp);

  // Keep only last 50 notes per user
  userData.notes = userData.notes.slice(0, 50);
  saveUserData(currentUser.id, userData);

  return noteWithTimestamp;
}

/**
 * Delete a note from history for current user
 */
export function deleteNoteFromHistory(noteId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const userData = getUserData(currentUser.id);

  // Count items before deletion
  const notesCountBefore = userData.notes?.length || 0;
  const quizResultsCountBefore = userData.quizResults?.length || 0;
  const hasProgressBefore = !!userData.quizProgress?.[noteId];

  // Delete note
  userData.notes = (userData.notes || []).filter((note) => note.id !== noteId);

  // Delete quiz results for this note
  userData.quizResults = (userData.quizResults || []).filter(
    (result) => result.noteId !== noteId
  );

  // Delete quiz progress for this note
  if (userData.quizProgress?.[noteId]) {
    delete userData.quizProgress[noteId];
  }

  saveUserData(currentUser.id, userData);

  // Log deletion summary
  console.log("=== NOTE DELETION SUMMARY ===");
  console.log("Note ID:", noteId);
  console.log("Notes:", notesCountBefore, "→", userData.notes.length);
  console.log(
    "Quiz Results:",
    quizResultsCountBefore,
    "→",
    userData.quizResults.length
  );
  console.log("Quiz Progress Deleted:", hasProgressBefore);
  console.log("============================");
}

/**
 * Clear all history for current user
 */
export function clearHistory() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const userData = getUserData(currentUser.id);

  // Count items before clearing
  const notesCount = userData.notes?.length || 0;
  const quizResultsCount = userData.quizResults?.length || 0;
  const progressCount = Object.keys(userData.quizProgress || {}).length;

  userData.notes = [];
  userData.quizResults = [];
  userData.quizProgress = {};
  saveUserData(currentUser.id, userData);

  console.log("=== CLEAR ALL DATA SUMMARY ===");
  console.log("Notes Cleared:", notesCount);
  console.log("Quiz Results Cleared:", quizResultsCount);
  console.log("Quiz Progress Cleared:", progressCount);
  console.log("==============================");
}

/**
 * Get quiz results for current user
 */
export function getQuizResults() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log("getQuizResults: No current user");
    return [];
  }

  const userData = getUserData(currentUser.id);
  const results = userData.quizResults || [];
  console.log(
    "getQuizResults: Retrieved",
    results.length,
    "results for user",
    currentUser.id
  );
  return results;
}

/**
 * Save quiz result for current user
 */
export function saveQuizResult(result) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log("saveQuizResult: No current user");
    return;
  }

  const userData = getUserData(currentUser.id);
  userData.quizResults = userData.quizResults || [];

  // Check if result for this question already exists and update it
  const existingIndex = userData.quizResults.findIndex(
    (r) =>
      r.noteId === result.noteId && r.questionIndex === result.questionIndex
  );

  const resultToSave = {
    ...result,
    userId: currentUser.id,
    timestamp: new Date().toISOString(),
  };

  if (existingIndex !== -1) {
    // Update existing result
    userData.quizResults[existingIndex] = resultToSave;
    console.log(
      "saveQuizResult: Updated existing result for question",
      result.questionIndex
    );
  } else {
    // Add new result
    userData.quizResults.push(resultToSave);
    console.log(
      "saveQuizResult: Added new result for question",
      result.questionIndex
    );
  }

  console.log(
    "saveQuizResult: Total results now:",
    userData.quizResults.length
  );

  saveUserData(currentUser.id, userData);
  console.log("saveQuizResult: User data saved to localStorage");
}

/**
 * Debug function to log all quiz results
 */
export function debugQuizResults() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log("DEBUG: No current user");
    return;
  }

  const userData = getUserData(currentUser.id);
  console.log("=== DEBUG QUIZ RESULTS ===");
  console.log("Current User:", currentUser);
  console.log("Quiz Results Count:", userData.quizResults?.length || 0);
  console.log("Quiz Results:", userData.quizResults);
  console.log("Quiz Progress:", userData.quizProgress);
  console.log("Notes Count:", userData.notes?.length || 0);
  console.log("========================");
}

/**
 * Get quiz progress for a specific note
 */
export function getQuizProgress(noteId) {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const userData = getUserData(currentUser.id);
  return userData.quizProgress?.[noteId] || null;
}

/**
 * Save quiz progress for a specific note
 */
export function saveQuizProgress(noteId, progress) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const userData = getUserData(currentUser.id);
  userData.quizProgress = userData.quizProgress || {};
  userData.quizProgress[noteId] = {
    ...progress,
    lastUpdated: new Date().toISOString(),
  };
  saveUserData(currentUser.id, userData);
  console.log("saveQuizProgress: Saved progress for note", noteId);
}

/**
 * Reset quiz results and progress for a specific note
 */
export function resetNoteQuizData(noteId) {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    console.log("resetNoteQuizData: No current user");
    return;
  }

  const userData = getUserData(currentUser.id);

  // Count items before reset
  const quizResultsCountBefore = userData.quizResults?.length || 0;
  const noteResultsBefore = (userData.quizResults || []).filter(
    (result) => result.noteId === noteId
  ).length;

  // Remove all quiz results for this note
  userData.quizResults = (userData.quizResults || []).filter(
    (result) => result.noteId !== noteId
  );

  // Remove quiz progress for this note
  const hasProgressBefore = !!userData.quizProgress?.[noteId];
  if (userData.quizProgress?.[noteId]) {
    delete userData.quizProgress[noteId];
  }

  saveUserData(currentUser.id, userData);

  console.log("=== NOTE QUIZ RESET SUMMARY ===");
  console.log("Note ID:", noteId);
  console.log("Quiz Results Removed:", noteResultsBefore);
  console.log(
    "Total Quiz Results:",
    quizResultsCountBefore,
    "→",
    userData.quizResults.length
  );
  console.log("Quiz Progress Cleared:", hasProgressBefore);
  console.log("===============================");
}

/**
 * Get user settings for current user
 */
export function getSettings() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    return {
      defaultDepth: "medium",
      preferredLanguage: "english",
      defaultFormat: "bullets",
    };
  }

  const userData = getUserData(currentUser.id);
  return (
    userData.settings || {
      defaultDepth: "medium",
      preferredLanguage: "english",
      defaultFormat: "bullets",
    }
  );
}

/**
 * Save user settings for current user
 */
export function saveSettings(settings) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const userData = getUserData(currentUser.id);
  userData.settings = settings;
  saveUserData(currentUser.id, userData);
}

/**
 * Export all data for current user as JSON
 */
export function exportAllData() {
  const currentUser = getCurrentUser();
  if (!currentUser) return null;

  const userData = getUserData(currentUser.id);
  return {
    user: currentUser,
    ...userData,
    exportedAt: new Date().toISOString(),
  };
}

/**
 * Import data for current user from JSON
 */
export function importData(data) {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  const userData = getUserData(currentUser.id);

  if (data.notes) userData.notes = data.notes;
  if (data.quizResults) userData.quizResults = data.quizResults;
  if (data.settings) userData.settings = data.settings;

  saveUserData(currentUser.id, userData);
}
