import { apiRequest } from './api.js'

export function getElections() {
  return apiRequest('/elections', { requiresAuth: true })
}

export function getMyVotes() {
  return apiRequest('/elections/my-votes', { requiresAuth: true })
}

export function hideMyVoteHistory(voteId) {
  return apiRequest(`/elections/my-votes/${voteId}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export function getPublishedResults() {
  return apiRequest('/elections/published', { requiresAuth: true })
}

export function createElection(election) {
  return apiRequest('/elections', {
    method: 'POST',
    body: election,
    requiresAuth: true,
  })
}

export function setElectionStatus(electionId, status) {
  return apiRequest(`/elections/${electionId}/status`, {
    method: 'PATCH',
    body: { status },
    requiresAuth: true,
  })
}

export function setResultsPublished(electionId, published) {
  return apiRequest(`/elections/${electionId}/results`, {
    method: 'PATCH',
    body: { published },
    requiresAuth: true,
  })
}

export function deleteElectionHistory(electionId) {
  return apiRequest(`/elections/${electionId}`, {
    method: 'DELETE',
    requiresAuth: true,
  })
}

export function getElectionProgress(electionId) {
  return apiRequest(`/elections/${electionId}/progress`, {
    requiresAuth: true,
  })
}

export function getPartyVoteStatistics(electionId) {
  return apiRequest(`/elections/${electionId}/party-statistics`, {
    requiresAuth: true,
  })
}

export function voteInElection(electionId, candidateId) {
  return apiRequest(`/elections/${electionId}/votes`, {
    method: 'POST',
    body: { candidateId },
    requiresAuth: true,
  })
}
