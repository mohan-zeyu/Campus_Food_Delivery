// cloudfunctions/review/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch (event.type) {
    case 'create':      return create(event, OPENID);
    case 'getByTarget': return getByTarget(event);
    case 'getByOrder':  return getByOrder(event, OPENID);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

async function create(event, openid) {
  const { orderId, targetType, targetId, score, content, images, isAiDraft } = event;

  // 检查订单归属与状态
  const order = await db.collection('orders').doc(orderId).get();
  if (order.data._openid !== openid) return { success: false, errMsg: '无权限' };
  if (order.data.status !== 'completed') return { success: false, errMsg: '订单未完成' };
  if (order.data.is_reviewed) return { success: false, errMsg: '已评价' };

  try {
    await db.collection('reviews').add({
      data: {
        _openid: openid,
        order_id: orderId,
        target_type: targetType,
        target_id: targetId,
        score: score || 5,
        content: content || '',
        images: images || [],
        is_ai_draft: isAiDraft || false,
        created_at: db.serverDate(),
      },
    });

    // 标记订单已评价
    await db.collection('orders').doc(orderId).update({
      data: { is_reviewed: true },
    });

    // 更新目标平均评分
    if (targetType === 'merchant') {
      await _updateMerchantRating(targetId);
    }

    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function _updateMerchantRating(merchantId) {
  const reviews = await db.collection('reviews')
    .where({ target_type: 'merchant', target_id: merchantId }).get();
  if (reviews.data.length === 0) return;
  const avg = reviews.data.reduce((s, r) => s + r.score, 0) / reviews.data.length;
  await db.collection('merchants').doc(merchantId).update({
    data: {
      avg_rating: Math.round(avg * 10) / 10,
      rating_count: reviews.data.length,
    },
  });
}

async function getByTarget(event) {
  const { targetId, targetType, page = 0 } = event;
  const PAGE_SIZE = 10;
  try {
    const res = await db.collection('reviews')
      .where({ target_id: targetId, target_type: targetType })
      .orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getByOrder(event, openid) {
  try {
    const res = await db.collection('reviews')
      .where({ order_id: event.orderId, _openid: openid }).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
