// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'cloud1-9ggbyent73ad05cc',
      traceUser: true,
    });

    // 检查是否已有缓存会话
    const cached = wx.getStorageSync('campus_eats_user');
    if (cached && cached.openid) {
      // 已登录过：恢复 globalData，后台静默刷新
      this.globalData.userInfo = cached;
      this.globalData.role = cached.role || 'user';
      this.globalData.openid = cached.openid;
      this.globalData.isLoaded = true;
      this._notifyCallbacks(cached);
      this._silentRefresh(); // 后台更新最新用户信息
    } else {
      // 首次启动或已清除缓存：等待用户主动登录
      this.globalData.isLoaded = false;
      // index 页面会检测未登录并跳转到 login 页
    }
  },

  // 主动登录（login 页面调用）
  login: function () {
    const api = require('./utils/api');
    return api.call('user', 'login').then(res => {
      if (res && res.data) {
        this.globalData.userInfo = res.data;
        this.globalData.role = res.data.role || 'user';
        this.globalData.openid = res.data._openid;
        this.globalData.isLoaded = true;
        wx.setStorageSync('campus_eats_user', res.data);
        this._notifyCallbacks(res.data);
      }
      return res;
    });
  },

  // 后台静默刷新（不阻塞页面）
  _silentRefresh: function () {
    const api = require('./utils/api');
    api.callSilent('user', 'login').then(res => {
      if (res && res.data) {
        this.globalData.userInfo = res.data;
        this.globalData.role = res.data.role || 'user';
        this.globalData.openid = res.data._openid;
        wx.setStorageSync('campus_eats_user', res.data);
      }
    }).catch(() => {});
  },

  _notifyCallbacks: function (userInfo) {
    if (this._loginCallbacks) {
      this._loginCallbacks.forEach(cb => cb(userInfo));
      this._loginCallbacks = [];
    }
  },

  // 页面调用此方法等待登录完成（登录后才执行 cb）
  waitForLogin: function (cb) {
    if (this.globalData.isLoaded) {
      cb(this.globalData.userInfo);
    } else {
      if (!this._loginCallbacks) this._loginCallbacks = [];
      this._loginCallbacks.push(cb);
    }
  },

  // 退出登录（清除缓存）
  logout: function () {
    wx.removeStorageSync('campus_eats_user');
    this.globalData.userInfo = null;
    this.globalData.role = 'user';
    this.globalData.openid = '';
    this.globalData.isLoaded = false;
    wx.reLaunch({ url: '/pages/login/index' });
  },

  globalData: {
    userInfo: null,
    role: 'user',      // 'user' | 'delivery' | 'merchant' | 'admin'
    openid: '',
    isLoaded: false,
  }
});
