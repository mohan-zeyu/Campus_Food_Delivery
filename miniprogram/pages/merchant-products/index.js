// pages/merchant-products/index.js
const api = require('../../utils/api');

Page({
  data: { products: [], loading: true, merchantId: '' },

  onLoad(options) {
    this.setData({ merchantId: options.merchantId });
    this.loadProducts();
  },

  onShow() { this.loadProducts(); },

  loadProducts() {
    api.call('product', 'getList', { merchantId: this.data.merchantId }).then(res => {
      this.setData({ products: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onAddProduct() {
    wx.navigateTo({ url: `/pages/merchant-product-edit/index?merchantId=${this.data.merchantId}` });
  },

  onEditProduct(e) {
    wx.navigateTo({ url: `/pages/merchant-product-edit/index?id=${e.currentTarget.dataset.id}&merchantId=${this.data.merchantId}` });
  },

  onToggleAvailable(e) {
    api.call('product', 'toggleAvailable', { id: e.currentTarget.dataset.id }).then(() => this.loadProducts());
  },
});
