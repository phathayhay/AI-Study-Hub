import { apiGet, apiPost } from '../../services/api'

export function getDocumentSummary(documentId) {
  return apiGet(`/api/ai/documents/${documentId}/summary`)
}

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
