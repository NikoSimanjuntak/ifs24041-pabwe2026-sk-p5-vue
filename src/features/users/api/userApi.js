import { apiGet, apiPut, apiRequest } from '@/helpers/apiHelper'

export const getUsers = (query) => apiGet('/users', query)

export const getMe = () => apiGet('/users/me')

export const updateMe = ({ name, email }) => apiPut('/users/me', { name, email })

export const updatePhoto = (file) => {
  const formData = new FormData()
  formData.append('photo', file)
  return apiRequest('/users/me/photo', { method: 'POST', body: formData })
}

export const updatePassword = ({ password, new_password }) =>
  apiPut('/users/me/password', { password, new_password })
