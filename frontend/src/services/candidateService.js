import { apiRequest } from './api.js'

export function getCandidates() {
  return apiRequest('/candidate')
}

export async function createCandidate(candidate) {
  const data = await apiRequest('/candidate', {
    method: 'POST',
    body: candidate,
    requiresAuth: true,
  })

  return data.response
}

export async function updateCandidate(candidateId, updates) {
  const data = await apiRequest(`/candidate/${candidateId}`, {
    method: 'PUT',
    body: updates,
    requiresAuth: true,
  })

  return data.response
}

export async function deleteCandidate(candidateId) {
  const data = await apiRequest(`/candidate/${candidateId}`, {
    method: 'DELETE',
    requiresAuth: true,
  })

  return data.response
}