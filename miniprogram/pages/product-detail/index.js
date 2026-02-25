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
    totalStr: '0.00',
    aiRemarkLoading: false,
  },

  _updateTotal() {
    const { product, quantity } = this.data;
    if (!product) return;
    this.setData({ totalStr: (product.price * quantity / 100).toFixed(2) });
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
      this._updateTotal();
    }).catch(() => this.setData({ loading: false }));
  },

  onQuantityMinus() {
    if (this.data.quantity > 1) {
      this.setData({ quantity: this.data.quantity - 1 });
      this._updateTotal();
    }
  },

  onQuantityPlus() {
    this.setData({ quantity: this.data.quantity + 1 });
    this._updateTotal();
  },

  onRemarksInput(e) {
    this.setData({ remarks: e.detail.value });
  },

  onAiRemark() {
    if (this.data.aiRemarkLoading) return;
    this.setData({ aiRemarkLoading: true });
    const { product } = this.data;
    api.call('ai', 'suggestRemarks', {
      productName: product.name,
      productId: this.productId,
    }).then(res => {
      this.setData({ aiRemarkLoading: false });
      const suggestions = res.data || [];
      if (!suggestions.length) {
        return wx.showToast({ title: 'AI建议暂不可用', icon: 'none' });
      }
      wx.showActionSheet({
        itemList: suggestions,
        success: (result) => {
          this.setData({ remarks: suggestions[result.tapIndex] });
        },
      });
    }).catch(() => {
      this.setData({ aiRemarkLoading: false });
      wx.showToast({ title: 'AI建议暂不可用', icon: 'none' });
    });
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
