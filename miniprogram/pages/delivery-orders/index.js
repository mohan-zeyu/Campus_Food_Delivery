// pages/delivery-orders/index.js — 接单大厅
const api = require('../../utils/api');
const { TASK_STATUS_LABEL } = require('../../utils/constants');

Page({
  data: {
    activeTab: 'orders',
    orders: [],
    tasks: [],
    loading: false,
  },

  onLoad() {
    this.loadOrders();
    this.loadTasks();
  },

  onPullDownRefresh() {
    Promise.all([this.loadOrders(), this.loadTasks()])
      .then(() => wx.stopPullDownRefresh());
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.tab });
  },

  loadOrders() {
    this.setData({ loading: true });
    return api.call('delivery', 'getAvailableOrders').then(res => {
      this.setData({ orders: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  loadTasks() {
    return api.callSilent('task', 'getList', { status: 'open', page: 0 }).then(res => {
      if (res && res.data) {
        this.setData({
          tasks: res.data.map(t => ({
            ...t,
            statusLabel: TASK_STATUS_LABEL[t.status] || t.status,
          })),
        });
      }
    }).catch(() => {});
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/delivery-order-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  onTaskTap(e) {
    wx.navigateTo({ url: `/pages/task-detail/index?id=${e.currentTarget.dataset.id}` });
  },
});
