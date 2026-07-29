import axios from 'axios'

export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined
    return data?.error ?? fallback
  }
  return fallback
}
