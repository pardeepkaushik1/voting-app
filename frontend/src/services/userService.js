import { apiRequest } from './api.js'

export async function getCurrentUser() {
  const data = await apiRequest('/user/profile', { requiresAuth: true })

  if (!data?.user) {
    throw new Error('The server did not return the current user profile.')
  }

  return data.user
}

export async function updateProfile(profile) {
  const data = await apiRequest('/user/profile', {
    method: 'PUT',
    body: profile,
    requiresAuth: true,
  })

  if (!data?.user) {
    throw new Error('The server did not return the updated profile.')
  }

  return data.user
}

export function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/user/profile/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
    requiresAuth: true,
  })
}

export async function uploadProfileImage(image) {
  const formData = new FormData()
  formData.append('image', image)

  return apiRequest('/user/profile-image', {
    method: 'POST',
    body: formData,
    requiresAuth: true,
  })
}

export function deleteProfileImage() {
  return apiRequest('/user/profile-image', {
    method: 'DELETE',
    requiresAuth: true,
  })
}