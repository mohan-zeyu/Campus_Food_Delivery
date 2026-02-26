// utils/constants.js

const ORDER_STATUS = {
  PENDING: 'pending',       // 待支付
  PAID: 'paid',             // 已支付
  ACCEPTED: 'accepted',     // 商家已接单
  PICKING_UP: 'picking_up', // 配送员取餐中
  IN_TRANSIT: 'in_transit', // 配送中
  DELIVERED: 'delivered',   // 已送达（待确认）
  COMPLETED: 'completed',   // 已完成
  CANCELLED: 'cancelled',   // 已取消
};

const ORDER_STATUS_LABEL = {
  pending: '待支付',
  paid: '待接单',
  accepted: '备餐中',
  picking_up: '取餐中',
  in_transit: '配送中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
};

const ROLES = {
  USER: 'user',
  DELIVERY: 'delivery',
  MERCHANT: 'merchant',
  ADMIN: 'admin',
};

const CAMPUS_ZONES = {
  EAST: 'east',
  WEST: 'west',
  NORTH: 'north',
  SOUTH: 'south',
};

const CAMPUS_ZONE_LABEL = {
  east: '东区',
  west: '西区',
  north: '北区',
  south: '南区',
};

const PRODUCT_CATEGORIES = ['主食', '饮品', '小吃', '套餐', '甜点', '其他'];

const ADDRESS_LABELS = ['宿舍', '教室', '办公室', '其他'];

const NOTICE_TYPES = {
  ANNOUNCEMENT: 'announcement',
  PROMOTION: 'promotion',
  SYSTEM: 'system',
};

const PAGE_SIZE = 10;

// 订阅消息模板ID（需在微信公众平台申请后替换）
const SUBSCRIBE_TMPL = {
  ORDER_STATUS: '', // 订单状态变更通知
  DELIVERY_ACCEPTED: '', // 配送员接单通知
  ORDER_COMPLETED: '', // 订单完成通知
};

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_LABEL,
  ROLES,
  CAMPUS_ZONES,
  CAMPUS_ZONE_LABEL,
  PRODUCT_CATEGORIES,
  ADDRESS_LABELS,
  NOTICE_TYPES,
  PAGE_SIZE,
  SUBSCRIBE_TMPL,
};
