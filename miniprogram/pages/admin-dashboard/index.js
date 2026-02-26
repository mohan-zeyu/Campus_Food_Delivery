// pages/admin-dashboard/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    stats: null,
    advStats: null,
    loading: true,
  },

  onLoad() {
    if (!auth.guard('admin')) return;
    this.loadStats();
  },

  loadStats() {
    Promise.all([
      api.call('admin', 'getStats'),
      api.call('admin', 'getAdvancedStats'),
    ]).then(([basicRes, advRes]) => {
      this.setData({
        stats: basicRes.data,
        advStats: advRes.data || null,
        loading: false,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onUsers() { wx.navigateTo({ url: '/pages/admin-users/index' }); },
  onMerchants() { wx.navigateTo({ url: '/pages/admin-merchants/index' }); },
  onOrders() { wx.navigateTo({ url: '/pages/admin-orders/index' }); },
  onNotices() { wx.navigateTo({ url: '/pages/admin-notices/index' }); },
});
