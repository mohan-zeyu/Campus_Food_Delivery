// pages/profile/index.js
const api = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    role: 'user',
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 3 });
    }
    getApp().waitForLogin(() => {
      // 每次 onShow 从云端拉最新用户信息，确保 DB 中的角色变更能即时生效
      api.callSilent('user', 'login').then(res => {
        if (res && res.data) {
          const app = getApp();
          app.globalData.userInfo = res.data;
          app.globalData.role = res.data.role || 'user';
          app.globalData.openid = res.data._openid;
          wx.setStorageSync('campus_eats_user', res.data);
          this.setData({
            userInfo: res.data,
            role: res.data.role || 'user',
          });
        }
      }).catch(() => {
        // 网络失败则用缓存数据
        const app = getApp();
        this.setData({
          userInfo: app.globalData.userInfo,
          role: app.globalData.role,
        });
      });
    });
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
    wx.switchTab({ url: '/pages/order-list/index' });
  },

  onDeliveryHistory() {
    wx.navigateTo({ url: '/pages/delivery-history/index' });
  },

  onFeedback() {
    wx.navigateTo({ url: '/pages/feedback/index' });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出登录？',
      success: res => {
        if (res.confirm) {
          getApp().logout();
        }
      },
    });
  },

});
