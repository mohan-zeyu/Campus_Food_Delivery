// pages/checkout/index.js
const api = require('../../utils/api');
const cart = require('../../utils/cart');

Page({
  data: {
    params: null,
    address: null,
    cartData: null,
    summary: {},
    submitting: false,
  },

  onLoad(options) {
    const params = JSON.parse(decodeURIComponent(options.p));
    this.setData({ params });
    const c = cart.get();
    const summary = cart.summary();
    this.setData({ cartData: c, summary });
    this.loadAddress(params.addressId);
  },

  loadAddress(id) {
    api.call('user', 'getAddresses').then(res => {
      const addr = res.data.find(a => a._id === id) || res.data[0];
      this.setData({ address: addr });
    });
  },

  onSubmitOrder() {
    if (this.data.submitting) return;
    const { params, address, cartData, summary } = this.data;
    if (!address) return wx.showToast({ title: '请选择地址', icon: 'none' });

    this.setData({ submitting: true });
    const items = cartData.items.map(i => ({
      product_id: i.product_id,
      quantity: i.quantity,
      remarks: i.remarks,
    }));

    api.call('order', 'create', {
      merchantId: params.merchantId,
      merchantName: params.merchantName,
      deliveryAddress: {
        label: address.label,
        building: address.building,
        room: address.room,
        contact: address.contact,
        phone: address.phone,
      },
      deliveryZone: address.campus_zone,
      items,
      deliveryFee: params.deliveryFee,
    }).then(res => {
      // 模拟支付
      return api.call('order', 'pay', { orderId: res.orderId });
    }).then(() => {
      cart.clear();
      wx.showToast({ title: '下单成功！', icon: 'success' });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/order-list/index' });
      }, 1500);
    }).catch(() => {
      this.setData({ submitting: false });
    });
  },
});
