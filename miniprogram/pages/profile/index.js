// pages/profile/index.js
Page({
  data: {
    userInfo: null,
    role: 'user',
  },

  onShow() {
    const app = getApp();
    this.setData({
      userInfo: app.globalData.userInfo,
      role: app.globalData.role,
    });
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 3 });
    }
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/address-list/index' });
  },

  onAddressList() {
    wx.navigateTo({ url: '/pages/address-list/index' });
  },

  onMerchantDashboard() {
    wx.navigateTo({ url: '/pages/merchant-dashboard/index' });
  },

  onAdminDashboard() {
    wx.navigateTo({ url: '/pages/admin-dashboard/index' });
  },

  onMyOrders() {
    wx.navigateTo({ url: '/pages/order-list/index' });
  },

  onDeliveryHistory() {
    wx.navigateTo({ url: '/pages/delivery-history/index' });
  },

  onApplyDelivery() {
    const api = require('../../utils/api');
    wx.showModal({
      title: '申请配送员',
      content: '成为配送员后可在接单页面接单，确认申请？',
      success: res => {
        if (res.confirm) {
          api.call('user', 'applyDelivery').then(() => {
            const app = getApp();
            app.globalData.role = 'delivery';
            this.setData({ role: 'delivery' });
            wx.showToast({ title: '申请成功！', icon: 'success' });
          });
        }
      },
    });
  },
});
