// pages/delivery-hall/index.js
const api = require('../../utils/api');

Page({
  data: {
    orders: [],
    loading: false,
    role: 'user',
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 2 });
    }
    // 等待登录完成后再检查角色，避免读到默认值 'user'
    getApp().waitForLogin(() => {
      const role = getApp().globalData.role;
      this.setData({ role });
      if (role === 'delivery') this.loadOrders();
    });
  },

  onPullDownRefresh() {
    if (this.data.role === 'delivery') {
      this.loadOrders().then(() => wx.stopPullDownRefresh());
    } else {
      wx.stopPullDownRefresh();
    }
  },

  loadOrders() {
    this.setData({ loading: true });
    return api.call('delivery', 'getAvailableOrders').then(res => {
      this.setData({ orders: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/delivery-order-detail/index?id=${e.currentTarget.dataset.id}` });
  },
});
