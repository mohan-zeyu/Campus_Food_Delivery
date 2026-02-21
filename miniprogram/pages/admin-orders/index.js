// pages/admin-orders/index.js
const api = require('../../utils/api');
const { statusLabel } = require('../../utils/format');
Page({
  data: { orders: [], loading: true },
  onLoad() { this.load(); },
  load() {
    api.call('admin', 'getOrders', { page: 0 }).then(res => {
      this.setData({
        orders: (res.data || []).map(o => ({ ...o, statusLabel: statusLabel(o.status) })),
        loading: false,
      });
    }).catch(() => this.setData({ loading: false }));
  },
  onResolve(e) {
    const { id, action } = e.currentTarget.dataset;
    api.call('admin', 'resolveDispute', { orderId: id, action }).then(() => this.load());
  },
});
