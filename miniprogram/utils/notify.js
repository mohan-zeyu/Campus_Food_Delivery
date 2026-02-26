// utils/notify.js
// 订阅消息通知工具
const { SUBSCRIBE_TMPL } = require('./constants');

/**
 * 请求订阅消息授权
 * @param {string[]} tmplIds - 模板ID数组
 * @returns {Promise} - 授权结果
 */
function requestSubscribe(tmplIds) {
  // 过滤掉空模板ID
  const validIds = tmplIds.filter(id => id && id.length > 0);
  if (validIds.length === 0) return Promise.resolve(null);

  return new Promise((resolve) => {
    wx.requestSubscribeMessage({
      tmplIds: validIds,
      success: resolve,
      fail: resolve, // 静默失败，不阻塞主流程
    });
  });
}

/**
 * 下单成功后请求订阅（订单状态变更 + 订单完成）
 */
function subscribeOrderUpdates() {
  return requestSubscribe([
    SUBSCRIBE_TMPL.ORDER_STATUS,
    SUBSCRIBE_TMPL.DELIVERY_ACCEPTED,
    SUBSCRIBE_TMPL.ORDER_COMPLETED,
  ]);
}

/**
 * 接单后请求订阅（配送相关通知）
 */
function subscribeDeliveryUpdates() {
  return requestSubscribe([
    SUBSCRIBE_TMPL.ORDER_STATUS,
  ]);
}

module.exports = {
  requestSubscribe,
  subscribeOrderUpdates,
  subscribeDeliveryUpdates,
};
