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

/**
 * Get all majors
 * Retrieves all majors configuration.
 * Method: GET
 * Path: /api/majors
 */
export function getMajors() {
  return apiGet(`/majors`);
}

/**
 * Get all courses
 * Retrieves all courses configuration.
 * Method: GET
 * Path: /api/courses
 */
export function getCourses() {
  return apiGet(`/courses`);
}

/**
 * Get all document categories
 * Retrieves all document categories configuration.
 * Method: GET
 * Path: /api/categories
 */
export function getCategories() {
  return apiGet(`/categories`);
}
