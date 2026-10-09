import { apiDelete, apiGet, apiPost, apiPut, apiRequest } from '@/helpers/apiHelper'

// filter: { is_me, is_closed } -> dikirim sebagai query parameter
export const getAucations = (filter = {}) => apiGet('/aucations', filter)

export const getAucation = (id) => apiGet(`/aucations/${id}`)

export const postAucation = ({ title, description, start_bid, closed_at }) =>
  apiPost('/aucations', { title, description, start_bid, closed_at })

export const putAucation = (id, { title, description, start_bid, closed_at }) =>
  apiPut(`/aucations/${id}`, { title, description, start_bid, closed_at })

export const postCover = (id, file) => {
  const formData = new FormData()
  formData.append('cover', file)
  return apiRequest(`/aucations/${id}/cover`, { method: 'POST', body: formData })
}

export const deleteAucation = (id) => apiDelete(`/aucations/${id}`)

export const postBid = (id, bid) => apiPost(`/aucations/${id}/bids`, { bid })

export const deleteBid = (id) => apiDelete(`/aucations/${id}/bids`)

export const deleteAllAucations = () => apiDelete('/aucations')
