// pages/order-detail/index.js
const api = require('../../utils/api');
const { statusLabel, formatDate } = require('../../utils/format');

Page({
  data: {
    order: null,
    loading: true,
    canCancel: false,
    canConfirm: false,
    canReview: false,
  },

  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },

  onShow() {
    this.loadOrder();
  },

  loadOrder() {
    api.call('order', 'getDetail', { orderId: this.orderId }).then(res => {
      const o = res.data;
      const statusStr = statusLabel(o.status);
      const timestamps = [
        { label: '下单', time: o.created_at, done: true },
        { label: '支付', time: o.paid_at, done: !!o.paid_at },
        { label: '商家接单', time: o.accepted_at, done: !!o.accepted_at },
        { label: '取餐', time: o.picked_up_at, done: !!o.picked_up_at },
        { label: '配送中', time: o.picked_up_at, done: !!o.picked_up_at },
        { label: '已送达', time: o.delivered_at, done: !!o.delivered_at },
        { label: '已完成', time: o.completed_at, done: !!o.completed_at },
      ].filter(t => t.done || ['下单', '支付', '商家接单'].includes(t.label));

      this.setData({
        order: { ...o, statusLabel: statusStr, timestamps },
        canCancel: ['pending', 'paid'].includes(o.status),
        canConfirm: o.status === 'delivered',
        canReview: o.status === 'completed' && !o.is_reviewed,
        loading: false,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onCancel() {
    wx.showModal({
      title: '取消订单',
      content: '确定取消该订单？',
      success: res => {
        if (res.confirm) {
          api.call('order', 'cancel', { orderId: this.orderId }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadOrder();
          });
        }
      },
    });
  },

  onConfirmDelivery() {
    api.call('order', 'confirmDelivery', { orderId: this.orderId }).then(() => {
      wx.showToast({ title: '已确认收货', icon: 'success' });
      this.loadOrder();
    });
  },

  onReview() {
    wx.navigateTo({
      url: `/pages/review/index?orderId=${this.orderId}&merchantId=${this.data.order.merchant_id}`,
    });
  },
});
