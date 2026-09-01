import api from '../api/axios'

export const settlementService = {
  createSettlement: (data) =>
    api.post('/api/settlements', data),

  getGroupSettlements: (groupId) =>
    api.get(`/api/settlements?groupId=${groupId}`),

  createRazorpayOrder: (amount) =>
    api.post('/api/settlements/razorpay-order', { amount }),

  verifyRazorpayPayment: (data) =>
    api.post('/api/settlements/verify', data),
}
