// pages/login/index.js
const api = require('../../utils/api');

Page({
  data: {
    loading: false,
  },

  onLoad() {
    const app = getApp();
    // 如果已登录，直接跳首页
    if (app.globalData.openid) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    api.call('user', 'login').then(res => {
      if (res && res.data) {
        const app = getApp();
        app.globalData.userInfo = res.data;
        app.globalData.role = res.data.role || 'user';
        app.globalData.openid = res.data._openid;
        app.globalData.isLoaded = true;
        wx.switchTab({ url: '/pages/index/index' });
      }
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
});
