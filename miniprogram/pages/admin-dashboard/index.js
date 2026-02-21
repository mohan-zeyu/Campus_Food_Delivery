// pages/admin-dashboard/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: { stats: null, loading: true },

  onLoad() {
    if (!auth.guard('admin')) return;
    this.loadStats();
  },

  loadStats() {
    api.call('admin', 'getStats').then(res => {
      this.setData({ stats: res.data, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onUsers() { wx.navigateTo({ url: '/pages/admin-users/index' }); },
  onMerchants() { wx.navigateTo({ url: '/pages/admin-merchants/index' }); },
  onOrders() { wx.navigateTo({ url: '/pages/admin-orders/index' }); },
});
