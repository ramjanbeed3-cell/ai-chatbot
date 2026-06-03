import api from './axios'

export const getConversations  = ()             => api.get('/conversations')
export const createConversation = (title)       => api.post('/conversations', { title })
export const getConversation   = (id)           => api.get(`/conversations/${id}`)
export const deleteConversation = (id)          => api.delete(`/conversations/${id}`)
export const getMessages       = (convId)       => api.get(`/conversations/${convId}/messages`)
export const sendMessage       = (convId, msg)  => api.post(`/conversations/${convId}/messages`, { message: msg })
