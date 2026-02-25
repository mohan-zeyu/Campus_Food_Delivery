// pages/login/index.js
Page({
  data: {
    loading: false,
  },

  onLoad() {
    // 已有缓存会话则直接跳首页
    if (getApp().globalData.isLoaded && getApp().globalData.openid) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  onLogin() {
    if (this.data.loading) return;
    this.setData({ loading: true });
    getApp().login().then(() => {
      wx.switchTab({ url: '/pages/index/index' });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },
});
