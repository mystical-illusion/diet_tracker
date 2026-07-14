import api from './api'

const foodService = {
  search:   (q = '', page = 1, limit = 20) => api.get('/foods/', { params: { q, page, limit } }),
  getById:  (id)                           => api.get(`/foods/${id}`),
  create:   (payload)                      => api.post('/foods/', payload),
  update:   (id, payload)                  => api.put(`/foods/${id}`, payload),
  delete:   (id)                           => api.delete(`/foods/${id}`),
}

export default foodService
