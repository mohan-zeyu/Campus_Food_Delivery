// pages/merchant-detail/index.js
const api = require('../../utils/api');
const cart = require('../../utils/cart');
const { fenToYuanStr } = require('../../utils/format');

Page({
  data: {
    merchant: null,
    categories: [],
    activeCategory: '',
    cartSummary: { itemCount: 0, itemsTotal: 0 },
    loading: true,
  },

  onLoad(options) {
    this.merchantId = options.id;
    this.loadDetail();
  },

  onShow() {
    this.refreshCart();
  },

  loadDetail() {
    api.call('merchant', 'getDetail', { merchantId: this.merchantId }).then(res => {
      const firstCat = res.data.categories[0] ? res.data.categories[0].name : '';
      this.setData({
        merchant: res.data.merchant,
        categories: res.data.categories,
        activeCategory: firstCat,
        loading: false,
      });
      this.refreshCart();
    }).catch(() => this.setData({ loading: false }));
  },

  refreshCart() {
    const summary = cart.summary();
    this.setData({ cartSummary: summary });
  },

  onCategoryTap(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.name });
  },

  onAddToCart(e) {
    const product = e.currentTarget.dataset.product;
    cart.addItem(product, 1, '').then(ok => {
      if (ok) this.refreshCart();
    });
  },

  onProductTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}&merchantId=${this.merchantId}` });
  },

  onGoCart() {
    wx.navigateTo({ url: '/pages/cart/index' });
  },

  fenToYuanStr(fen) {
    return fenToYuanStr(fen);
  },
});
