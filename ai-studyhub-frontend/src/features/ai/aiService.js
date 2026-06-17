import { apiGet, apiPost } from '../../services/api'

export function getDocumentSummary(documentId) {
  return apiGet(`/api/ai/documents/${documentId}/summary`)
}

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

export function getChatSessions() {
  return apiGet('/api/chat/sessions')
}

export function createChatSession({ documentId, sessionTitle } = {}) {
  return apiPost('/api/chat/sessions', {
    documentId: documentId ? Number(documentId) : undefined,
    sessionTitle,
  })
}

export function getChatSessionMessages(sessionId) {
  return apiGet(`/api/chat/sessions/${sessionId}/messages`)
}

export function sendChatMessage(sessionId, content) {
  return apiPost(`/api/chat/sessions/${sessionId}/messages`, { content })
}
