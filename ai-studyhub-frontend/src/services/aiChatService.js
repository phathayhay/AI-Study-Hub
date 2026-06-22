import { apiGet, apiPost } from './api'

/**
 * Create a new chat session
 * Starts a new chat session. Optionally links it to a document context for targeted AI Q&A.
 * Method: POST
 * Path: /api/chat/sessions
 * @param {any} body - Request body
 */
export function createSession(body) {
  return apiPost(`/chat/sessions`, body);
}

/**
 * Get messages history
 * Retrieves the full message history for a specific chat session.
 * Method: GET
 * Path: /api/chat/sessions/{sessionId}/messages
 * @param {any} sessionId - Path parameter
 */
export function getSessionMessages(sessionId) {
  return apiGet(`/chat/sessions/${sessionId}/messages`);
}

/**
 * Get user's chat sessions
 * Retrieves all chat sessions for the currently authenticated user, ordered by most recently updated.
 * Method: GET
 * Path: /api/chat/sessions
 */
export function getUserSessions() {
  return apiGet(`/chat/sessions`);
}

/**
 * Send chat message
 * Sends a new message to the chat session, gets contextual AI response from Gemini, and returns the AI's reply.
 * Method: POST
 * Path: /api/chat/sessions/{sessionId}/messages
 * @param {any} sessionId - Path parameter
 * @param {any} body - Request body
 */
export function sendMessage(sessionId, body) {
  return apiPost(`/chat/sessions/${sessionId}/messages`, body);
}
