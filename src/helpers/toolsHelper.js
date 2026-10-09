import Swal from 'sweetalert2'

const baseOptions = {
  confirmButtonColor: '#0f4c4a',
  cancelButtonColor: '#6b7c80',
}

export function showSuccessDialog(message, title = 'Berhasil') {
  return Swal.fire({ ...baseOptions, icon: 'success', title, text: message, timer: 2200 })
}

export function showErrorDialog(message, title = 'Terjadi kesalahan') {
  return Swal.fire({ ...baseOptions, icon: 'error', title, text: message })
}

export async function showConfirmDialog(message, title = 'Apakah kamu yakin?') {
  const result = await Swal.fire({
    ...baseOptions,
    icon: 'warning',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'Ya, lanjutkan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#b3372f',
  })
  return result.isConfirmed
}

export function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export function formatDate(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    return '-'
  }
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

// ISO -> nilai untuk <input type="datetime-local"> (waktu lokal)
export function toDateTimeLocal(value) {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
