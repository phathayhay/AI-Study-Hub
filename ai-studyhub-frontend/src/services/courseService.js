import { apiGet } from './api'

/**
 * Get popular courses
 * Retrieves courses sorted by total document downloads, with file and download counts. Accessible by guest users.
 * Method: GET
 * Path: /api/courses/popular
 */
export function getPopularCourses() {
  return apiGet(`/courses/popular`);
}
