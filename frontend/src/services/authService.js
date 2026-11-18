import { apiRequest } from './api.js'

export function login(credentials) {
  return apiRequest('/user/login', {
    method: 'POST',
    body: credentials,
  })
}

export function signup(userDetails) {
  return apiRequest('/user/signup', {
    method: 'POST',
    body: userDetails,
  })
}

export function verifyEmail({ email, otp }) {
  return apiRequest('/user/verify-email', {
    method: 'POST',
    body: { email, otp },
  })
}

export function requestPasswordReset({ aadharCardNumber }) {
  return apiRequest('/user/forgot-password', {
    method: 'POST',
    body: { aadharCardNumber },
  })
}

export function resetPassword({ aadharCardNumber, otp, newPassword }) {
  return apiRequest('/user/reset-password', {
    method: 'POST',
    body: { aadharCardNumber, otp, newPassword },
  })
}