import { apiRequest } from './api.js'

export function getRegisteredUsers() {
  return apiRequest('/admin/users', { requiresAuth: true })
}

export function setUserBlocked(userId, blocked) {
  return apiRequest(`/admin/users/${userId}/block`, {
    method: 'PATCH',
    body: { blocked },
    requiresAuth: true,
  })
}

export function deleteRegisteredUser(userId) {
  return apiRequest(`/admin/users/${userId}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}
