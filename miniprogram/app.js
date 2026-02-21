// app.js
App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
      return;
    }
    wx.cloud.init({
      env: 'your-env-id', // TODO: 替换为你的云环境 ID
      traceUser: true,
    });
    this._autoLogin();
  },

  _autoLogin: function () {
    const api = require('./utils/api');
    api.call('user', 'login').then(res => {
      if (res && res.data) {
        this.globalData.userInfo = res.data;
        this.globalData.role = res.data.role || 'user';
        this.globalData.openid = res.data._openid;
        this.globalData.isLoaded = true;
        if (this._loginCallbacks) {
          this._loginCallbacks.forEach(cb => cb(res.data));
          this._loginCallbacks = [];
        }
      }
    }).catch(err => {
      console.error('自动登录失败', err);
      this.globalData.isLoaded = true;
      if (this._loginCallbacks) {
        this._loginCallbacks.forEach(cb => cb(null));
        this._loginCallbacks = [];
      }
    });
  },

  // 页面调用此方法等待登录完成
  waitForLogin: function (cb) {
    if (this.globalData.isLoaded) {
      cb(this.globalData.userInfo);
    } else {
      if (!this._loginCallbacks) this._loginCallbacks = [];
      this._loginCallbacks.push(cb);
    }
  },

  globalData: {
    userInfo: null,
    role: 'user',      // 'user' | 'delivery' | 'merchant' | 'admin'
    openid: '',
    isLoaded: false,
  }
});
