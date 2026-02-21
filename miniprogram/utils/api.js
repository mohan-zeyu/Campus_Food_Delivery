// utils/api.js
// 统一云函数调用封装：自动 loading、错误 toast

const api = {
  /**
   * 调用云函数
   * @param {string} fn    云函数名
   * @param {string} type  操作类型
   * @param {object} data  附加数据
   * @returns {Promise<any>} result (res.result)
   */
  call(fn, type, data = {}) {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '加载中...', mask: true });
      wx.cloud.callFunction({
        name: fn,
        data: { type, ...data },
      }).then(res => {
        wx.hideLoading();
        if (res.result && res.result.success === false) {
          wx.showToast({ title: res.result.errMsg || '操作失败', icon: 'none', duration: 2000 });
          reject(res.result);
        } else {
          resolve(res.result);
        }
      }).catch(err => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误，请重试', icon: 'none', duration: 2000 });
        console.error(`[api] ${fn}/${type} error:`, err);
        reject(err);
      });
    });
  },

  /**
   * 静默调用（不显示 loading/toast），用于后台操作
   */
  callSilent(fn, type, data = {}) {
    return wx.cloud.callFunction({
      name: fn,
      data: { type, ...data },
    }).then(res => res.result);
  },
};

module.exports = api;
