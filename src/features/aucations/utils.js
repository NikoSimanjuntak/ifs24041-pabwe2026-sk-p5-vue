export function getBids(aucation) {
  return Array.isArray(aucation?.bids) ? aucation.bids : []
}

export function getHighestBid(aucation) {
  const amounts = getBids(aucation).map((bid) => Number(bid.bid) || 0)
  return Math.max(Number(aucation?.start_bid) || 0, ...amounts)
}

export function isClosed(aucation, now = Date.now()) {
  if (aucation?.is_closed === true || aucation?.is_closed === 1) {
    return true
  }
  const closedAt = new Date(aucation?.closed_at).getTime()
  return !Number.isNaN(closedAt) && closedAt <= now
}

export function getCountdown(aucation, now = Date.now()) {
  if (isClosed(aucation, now)) {
    return 'Ditutup'
  }
  const closedAt = new Date(aucation?.closed_at).getTime()
  if (Number.isNaN(closedAt)) {
    return 'Tanpa batas waktu'
  }
  const minutes = Math.max(1, Math.floor((closedAt - now) / 60000))
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days}h ${hours}j lagi`
  if (hours > 0) return `${hours}j ${mins}m lagi`
  return `${mins}m lagi`
}

export function matchesSearch(aucation, keyword) {
  const query = String(keyword || '').trim().toLowerCase()
  if (!query) {
    return true
  }
  return `${aucation.title || ''} ${aucation.description || ''}`.toLowerCase().includes(query)
}

export function getBidderName(bid) {
  return bid?.user?.name || bid?.user_name || 'Peserta'
}

export function isOwnedBy(aucation, userId) {
  const ownerId = aucation?.user_id ?? aucation?.user?.id
  return userId !== undefined && userId !== null && ownerId === userId
}

// Ringkasan teks polos dari deskripsi markdown (untuk kartu)
export function plainText(markdown) {
  return String(markdown || '')
    .replace(/[#*_`>~[\]()!-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function validateAucationForm({ title, description, start_bid, closed_at }, now = Date.now()) {
  const errors = {}
  if (!String(title || '').trim()) errors.title = 'Judul wajib diisi.'
  if (!String(description || '').trim()) errors.description = 'Deskripsi wajib diisi.'
  if (!(Number(start_bid) > 0)) errors.start_bid = 'Harga awal harus lebih dari 0.'
  const closedAt = new Date(closed_at).getTime()
  if (!closed_at || Number.isNaN(closedAt)) {
    errors.closed_at = 'Batas waktu penutupan wajib diisi.'
  } else if (closedAt <= now) {
    errors.closed_at = 'Batas waktu harus di masa depan.'
  }
  return errors
}
