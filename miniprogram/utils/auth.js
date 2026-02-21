// utils/auth.js
// 权限检查与登录守卫

const ROLES = require('./constants').ROLES;

const auth = {
  /**
   * 检查当前角色是否满足要求，否则返回首页
   * 在 onLoad 中调用
   * @param {string|string[]} requiredRole
   * @returns {boolean} 是否通过
   */
  guard(requiredRole) {
    const app = getApp();
    const role = app.globalData.role;
    const allowed = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!allowed.includes(role)) {
      wx.showToast({ title: '无权限访问', icon: 'none' });
      setTimeout(() => wx.navigateBack(), 1000);
      return false;
    }
    return true;
  },

  /**
   * 要求已登录（任意角色）
   * 未登录时跳转登录页
   */
  requireLogin() {
    const app = getApp();
    if (!app.globalData.openid) {
      wx.redirectTo({ url: '/pages/login/index' });
      return false;
    }
    return true;
  },

  /**
   * 获取当前角色
   */
  getRole() {
    return getApp().globalData.role;
  },

  /**
   * 是否是指定角色
   */
  is(role) {
    return getApp().globalData.role === role;
  },

  ROLES,
};

module.exports = auth;
