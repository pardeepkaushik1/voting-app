import { apiRequest } from './api.js'

export function getMyComplaints() {
  return apiRequest('/complaints/mine', { requiresAuth: true })
}

export function submitComplaint(complaint) {
  return apiRequest('/complaints', {
    method: 'POST',
    body: complaint,
    requiresAuth: true,
  })
}

export function getAllComplaints() {
  return apiRequest('/complaints/admin', { requiresAuth: true })
}

export function updateComplaint(complaintId, updates) {
  return apiRequest(`/complaints/admin/${complaintId}`, {
    method: 'PATCH',
    body: updates,
    requiresAuth: true,
  })
}
