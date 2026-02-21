// pages/merchant-orders/index.js
const api = require('../../utils/api');
const { statusLabel } = require('../../utils/format');

Page({
  data: { orders: [], loading: true, merchantId: '', hasMore: true, page: 0 },

  onLoad(options) {
    this.setData({ merchantId: options.merchantId });
    this.loadOrders(true);
  },

  onPullDownRefresh() {
    this.loadOrders(true).then(() => wx.stopPullDownRefresh());
  },

  loadOrders(reset = false) {
    const page = reset ? 0 : this.data.page;
    if (reset) this.setData({ loading: true, page: 0 });
    return api.call('order', 'getByMerchant', { merchantId: this.data.merchantId, page }).then(res => {
      const orders = reset ? res.data : [...this.data.orders, ...res.data];
      this.setData({
        orders: orders.map(o => ({ ...o, statusLabel: statusLabel(o.status) })),
        loading: false, hasMore: res.hasMore, page: page + 1,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onConfirm(e) {
    api.call('order', 'merchantConfirm', { orderId: e.currentTarget.dataset.id }).then(() => {
      wx.showToast({ title: '已接单', icon: 'success' });
      this.loadOrders(true);
    });
  },
});
