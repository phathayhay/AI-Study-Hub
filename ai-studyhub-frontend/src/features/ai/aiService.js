import { apiGet, apiPost } from '../../services/api'

export function generateSummary(documentId) {
  return apiPost(`/ai/documents/${documentId}/summary`)
}

export function generateQuiz(documentId, difficulty = 'MEDIUM') {
  return apiPost(`/ai/documents/${documentId}/quiz?difficulty=${difficulty}`)
}

export function generateFlashcards(documentId) {
  return apiPost(`/ai/documents/${documentId}/flashcards`)
}

export function getDocumentQuizzes(documentId) {
  return apiGet(`/ai/documents/${documentId}/quizzes`)
}

export function getDocumentFlashcardSets(documentId) {
  return apiGet(`/ai/documents/${documentId}/flashcard-sets`)
}

export function getQuiz(quizId) {
  return apiGet(`/ai/quizzes/${quizId}`)
}

export function getFlashcardSet(setId) {
  return apiGet(`/ai/flashcards/${setId}`)
}
