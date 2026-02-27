// pages/delivery-orders/index.js — 接单大厅
const api = require('../../utils/api');
const { TASK_STATUS_LABEL, ORDER_STATUS_LABEL } = require('../../utils/constants');

Page({
  data: {
    activeTab: 'orders',
    orders: [],
    tasks: [],
    myOrders: [],
    loading: false,
    myOrdersLoading: false,
  },

  onLoad(options) {
    if (options.tab) {
      this.setData({ activeTab: options.tab });
    }
    this.loadOrders();
    this.loadTasks();
    this.loadMyOrders();
  },

  onShow() {
    // Refresh my orders when returning from detail page
    if (this.data.activeTab === 'myOrders') {
      this.loadMyOrders();
    }
  },

  onPullDownRefresh() {
    const loads = [this.loadOrders(), this.loadTasks(), this.loadMyOrders()];
    Promise.all(loads).then(() => wx.stopPullDownRefresh());
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

  loadMyOrders() {
    this.setData({ myOrdersLoading: true });
    return api.callSilent('delivery', 'getHistory', { page: 0 }).then(res => {
      if (res && res.data) {
        this.setData({
          myOrders: res.data.map(d => ({
            ...d,
            statusLabel: ORDER_STATUS_LABEL[d.status] || d.status,
          })),
          myOrdersLoading: false,
        });
      }
    }).catch(() => this.setData({ myOrdersLoading: false }));
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/delivery-order-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  onMyOrderTap(e) {
    wx.navigateTo({ url: `/pages/delivery-order-detail/index?id=${e.currentTarget.dataset.id}` });
  },

  onTaskTap(e) {
    wx.navigateTo({ url: `/pages/task-detail/index?id=${e.currentTarget.dataset.id}` });
  },
});
