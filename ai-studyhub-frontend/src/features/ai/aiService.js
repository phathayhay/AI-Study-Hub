import { apiGet, apiPost } from '../../services/api'

export function generateSummary(documentId) {
  return apiPost(`/api/ai/documents/${documentId}/summary`, {})
}

export function generateQuiz(documentId, difficulty = 'MEDIUM') {
  return apiPost(`/api/ai/documents/${documentId}/quiz?difficulty=${encodeURIComponent(difficulty)}`, {})
}

export function getDocumentQuizzes(documentId) {
  return apiGet(`/api/ai/documents/${documentId}/quizzes`)
}

export function getQuizDetails(quizId) {
  return apiGet(`/api/ai/quizzes/${quizId}`)
}

export function generateFlashcards(documentId) {
  return apiPost(`/api/ai/documents/${documentId}/flashcards`, {})
}

export function getDocumentFlashcardSets(documentId) {
  return apiGet(`/api/ai/documents/${documentId}/flashcard-sets`)
}

export function getFlashcardSetDetails(setId) {
  return apiGet(`/api/ai/flashcards/${setId}`)
}
