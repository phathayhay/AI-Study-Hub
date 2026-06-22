import { apiGet, apiPost } from './api'

/**
 * Generate learning flashcards
 * Requests Gemini to automatically extract key terms and definitions to generate flashcard sets from a document.
 * Method: POST
 * Path: /api/ai/documents/{documentId}/flashcards
 * @param {any} documentId - Path parameter
 */
export function generateFlashcards(documentId) {
  return apiPost(`/ai/documents/${documentId}/flashcards`);
}

/**
 * Generate learning quiz
 * Requests Gemini to automatically generate a multiple-choice questions quiz from a document.
 * Method: POST
 * Path: /api/ai/documents/{documentId}/quiz
 * @param {any} documentId - Path parameter
 * @param {any} difficulty - Query parameter
 */
export function generateQuiz(documentId, difficulty) {
  const query = new URLSearchParams();
  if (difficulty !== undefined && difficulty !== null) query.append('difficulty', difficulty);
  return apiPost(`/ai/documents/${documentId}/quiz${query.toString() ? `?${query.toString()}` : ''}`);
}

/**
 * Generate document summary
 * Requests Gemini to analyze a document, extracting a short summary, a detailed summary, and key takeaways.
 * Method: POST
 * Path: /api/ai/documents/{documentId}/summary
 * @param {any} documentId - Path parameter
 */
export function generateSummary(documentId) {
  return apiPost(`/ai/documents/${documentId}/summary`);
}

/**
 * Get flashcard set details
 * Retrieves cards and terms for a specific flashcard set by its unique ID.
 * Method: GET
 * Path: /api/ai/flashcards/{setId}
 * @param {any} setId - Path parameter
 */
export function getFlashcardSetDetails(setId) {
  return apiGet(`/ai/flashcards/${setId}`);
}

/**
 * Get document flashcard sets list
 * Retrieves all flashcard sets generated from a specific document.
 * Method: GET
 * Path: /api/ai/documents/{documentId}/flashcard-sets
 * @param {any} documentId - Path parameter
 */
export function getFlashcardSets(documentId) {
  return apiGet(`/ai/documents/${documentId}/flashcard-sets`);
}

/**
 * Get quiz details
 * Retrieves questions and choices for a specific quiz by its unique ID.
 * Method: GET
 * Path: /api/ai/quizzes/{quizId}
 * @param {any} quizId - Path parameter
 */
export function getQuizDetails(quizId) {
  return apiGet(`/ai/quizzes/${quizId}`);
}

/**
 * Get document quizzes list
 * Retrieves all quiz sets generated from a specific document.
 * Method: GET
 * Path: /api/ai/documents/{documentId}/quizzes
 * @param {any} documentId - Path parameter
 */
export function getQuizzes(documentId) {
  return apiGet(`/ai/documents/${documentId}/quizzes`);
}

/**
 * Get existing document summary
 * Retrieves the pre-generated summary of a document if it exists.
 * Method: GET
 * Path: /api/ai/documents/{documentId}/summary
 * @param {any} documentId - Path parameter
 */
export function getSummary(documentId) {
  return apiGet(`/ai/documents/${documentId}/summary`);
}
