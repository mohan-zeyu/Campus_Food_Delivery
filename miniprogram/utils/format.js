// utils/format.js
const { ORDER_STATUS_LABEL, CAMPUS_ZONE_LABEL } = require('./constants');

/**
 * 分转元，保留2位小数
 * @param {number} fen
 * @returns {string} e.g. "12.50"
 */
function fenToYuan(fen) {
  if (fen == null || isNaN(fen)) return '0.00';
  return (fen / 100).toFixed(2);
}

/**
 * 分转元，带¥符号
 */
function fenToYuanStr(fen) {
  return '¥' + fenToYuan(fen);
}

/**
 * 格式化日期时间
 * @param {Date|string|number} date
 * @param {string} format 'datetime' | 'date' | 'time' | 'relative'
 */
function formatDate(date, format = 'datetime') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const pad = n => String(n).padStart(2, '0');
  const Y = d.getFullYear();
  const M = pad(d.getMonth() + 1);
  const D = pad(d.getDate());
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());

  if (format === 'date') return `${Y}-${M}-${D}`;
  if (format === 'time') return `${h}:${m}`;
  if (format === 'relative') return formatRelative(d);
  return `${M}-${D} ${h}:${m}`;
}

function formatRelative(d) {
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}-${pad(d.getDate())}`;
}

/**
 * 订单状态文字
 */
function statusLabel(status) {
  return ORDER_STATUS_LABEL[status] || status;
}

/**
 * 校区文字
 */
function zoneLabel(zone) {
  return CAMPUS_ZONE_LABEL[zone] || zone;
}

/**
 * 生成订单号
 */
function generateOrderNo() {
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  return `CE${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${Date.now().toString().slice(-6)}`;
}

/**
 * 截断字符串
 */
function truncate(str, len = 20) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
}

module.exports = {
  fenToYuan,
  fenToYuanStr,
  formatDate,
  statusLabel,
  zoneLabel,
  generateOrderNo,
  truncate,
};
