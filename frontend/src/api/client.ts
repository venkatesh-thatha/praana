import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

export const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('praana_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('praana_token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
