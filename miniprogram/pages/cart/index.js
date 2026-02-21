// pages/cart/index.js
const cart = require('../../utils/cart');
const api = require('../../utils/api');

Page({
  data: {
    cartData: null,
    addresses: [],
    selectedAddress: null,
    merchantInfo: null,
    deliveryFee: 0,
    summary: { itemCount: 0, itemsTotal: 0, packagingFee: 0 },
  },

  onShow() {
    this.loadCart();
  },

  loadCart() {
    const c = cart.get();
    const summary = cart.summary();
    this.setData({ cartData: c, summary });
    if (c && c.merchant_id) {
      this.loadMerchant(c.merchant_id);
      this.loadAddresses();
    }
  },

  loadMerchant(merchantId) {
    api.call('merchant', 'getDetail', { merchantId }).then(res => {
      const merchant = res.data.merchant;
      this.setData({ merchantInfo: merchant });
      this.calcDeliveryFee(merchant);
    });
  },

  loadAddresses() {
    api.call('user', 'getAddresses').then(res => {
      const addresses = res.data || [];
      const def = addresses.find(a => a.is_default) || addresses[0] || null;
      this.setData({ addresses, selectedAddress: def });
      if (def && this.data.merchantInfo) {
        this.calcDeliveryFee(this.data.merchantInfo, def);
      }
    });
  },

  calcDeliveryFee(merchant, address) {
    const addr = address || this.data.selectedAddress;
    if (!addr || !merchant) return;
    const rules = merchant.delivery_fee_rules || [];
    const rule = rules.find(r => r.zone === addr.campus_zone);
    this.setData({ deliveryFee: rule ? rule.fee : 200 });
  },

  onQuantityChange(e) {
    const { productId, remarks, delta } = e.currentTarget.dataset;
    const c = cart.get();
    const item = c.items.find(i => i.product_id === productId && i.remarks === remarks);
    if (item) {
      cart.updateQuantity(productId, remarks, item.quantity + delta);
      this.loadCart();
    }
  },

  onRemoveItem(e) {
    const { productId, remarks } = e.currentTarget.dataset;
    cart.updateQuantity(productId, remarks, 0);
    this.loadCart();
  },

  onClearCart() {
    wx.showModal({
      title: '清空购物车',
      content: '确定要清空购物车吗？',
      success: res => {
        if (res.confirm) {
          cart.clear();
          this.loadCart();
        }
      },
    });
  },

  onAddressSelect() {
    wx.navigateTo({ url: '/pages/address-list/index?select=1' });
  },

  onAddAddress() {
    wx.navigateTo({ url: '/pages/address-edit/index' });
  },

  onCheckout() {
    const { cartData, selectedAddress, deliveryFee, summary, merchantInfo } = this.data;
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      return wx.showToast({ title: '购物车为空', icon: 'none' });
    }
    if (!selectedAddress) {
      return wx.showToast({ title: '请选择收货地址', icon: 'none' });
    }
    if (merchantInfo && summary.itemsTotal < merchantInfo.min_order) {
      return wx.showToast({ title: `未达起送金额¥${merchantInfo.min_order/100}`, icon: 'none' });
    }
    const params = encodeURIComponent(JSON.stringify({
      merchantId: cartData.merchant_id,
      merchantName: cartData.merchant_name,
      addressId: selectedAddress._id,
      deliveryFee,
    }));
    wx.navigateTo({ url: `/pages/checkout/index?p=${params}` });
  },

  onGoHome() {
    wx.switchTab({ url: '/pages/index/index' });
  },
});
