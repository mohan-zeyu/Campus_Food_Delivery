// pages/product-detail/index.js
const api = require('../../utils/api');
const cart = require('../../utils/cart');

Page({
  data: {
    product: null,
    merchant: null,
    quantity: 1,
    remarks: '',
    loading: true,
  },

  onLoad(options) {
    this.productId = options.id;
    this.merchantId = options.merchantId;
    this.loadProduct();
  },

  loadProduct() {
    Promise.all([
      api.call('product', 'getDetail', { productId: this.productId }),
      api.call('merchant', 'getDetail', { merchantId: this.merchantId }),
    ]).then(([pRes, mRes]) => {
      this.setData({
        product: pRes.data,
        merchant: mRes.data.merchant,
        loading: false,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onQuantityMinus() {
    if (this.data.quantity > 1) this.setData({ quantity: this.data.quantity - 1 });
  },

  onQuantityPlus() {
    this.setData({ quantity: this.data.quantity + 1 });
  },

  onRemarksInput(e) {
    this.setData({ remarks: e.detail.value });
  },

  onAddToCart() {
    const { product, merchant, quantity, remarks } = this.data;
    const productWithMerchant = {
      ...product,
      merchant_id: merchant._id,
      merchant_name: merchant.name,
    };
    cart.addItem(productWithMerchant, quantity, remarks).then(ok => {
      if (ok) {
        wx.showToast({ title: '已加入购物车', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1000);
      }
    });
  },
});
