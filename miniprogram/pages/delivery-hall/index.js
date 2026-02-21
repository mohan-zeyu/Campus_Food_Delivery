// pages/delivery-hall/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');
const { fenToYuanStr, formatDate } = require('../../utils/format');

Page({
  data: {
    orders: [],
    loading: false,
    role: 'user',
  },

  onLoad() {
    const app = getApp();
    this.setData({ role: app.globalData.role });
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 2 });
    }
    const app = getApp();
    const role = app.globalData.role;
    this.setData({ role });
    if (role === 'delivery') this.loadOrders();
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => wx.stopPullDownRefresh());
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

  fenToYuanStr(v) { return fenToYuanStr(v); },
  formatDate(d) { return formatDate(d); },
});
