// pages/delivery-order-detail/index.js
const api = require('../../utils/api');

Page({
  data: {
    order: null,
    loading: true,
    actionLoading: false,
  },

  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },

  loadOrder() {
    api.call('order', 'getDetail', { orderId: this.orderId }).then(res => {
      this.setData({ order: res.data, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onAccept() {
    this.setData({ actionLoading: true });
    api.call('delivery', 'acceptOrder', { orderId: this.orderId }).then(() => {
      wx.showToast({ title: '接单成功！', icon: 'success' });
      this.loadOrder();
    }).catch(() => this.setData({ actionLoading: false }));
  },

  onPickUp() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'pickUp' }).then(() => {
      wx.showToast({ title: '已取餐', icon: 'success' });
      this.loadOrder();
    });
  },

  onDispatch() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'dispatch' }).then(() => {
      wx.showToast({ title: '配送中', icon: 'success' });
      this.loadOrder();
    });
  },

  onDeliver() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'deliver' }).then(() => {
      wx.showToast({ title: '已送达', icon: 'success' });
      this.loadOrder();
    });
  },
});
