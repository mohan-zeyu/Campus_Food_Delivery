// pages/merchant-dashboard/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    merchant: null,
    stats: { todayOrders: 0, todayRevenue: 0, pendingOrders: 0 },
    loading: true,
  },

  onLoad() {
    const app = getApp();
    if (!auth.guard(['merchant', 'admin'])) return;
    this.merchantId = app.globalData.userInfo && app.globalData.userInfo.merchant_id;
    if (!this.merchantId) {
      wx.showToast({ title: '未绑定商家', icon: 'none' });
      return;
    }
    this.loadData();
  },

  loadData() {
    api.call('merchant', 'getDetail', { merchantId: this.merchantId }).then(res => {
      this.setData({ merchant: res.data.merchant, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onProductManage() {
    wx.navigateTo({ url: `/pages/merchant-products/index?merchantId=${this.merchantId}` });
  },

  onOrderManage() {
    wx.navigateTo({ url: `/pages/merchant-orders/index?merchantId=${this.merchantId}` });
  },

  onToggleStatus() {
    api.call('merchant', 'toggleStatus', { id: this.merchantId }).then(res => {
      this.setData({ 'merchant.status': res.status });
      wx.showToast({ title: res.status === 'open' ? '已开业' : '已打烊', icon: 'success' });
    });
  },
});
