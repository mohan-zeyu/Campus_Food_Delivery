// cloudfunctions/admin/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  // 验证 admin 权限（除登录外）
  if (event.type !== 'checkAdmin') {
    const userRes = await db.collection('users').where({ _openid: OPENID }).limit(1).get();
    const u = userRes.data[0];
    if (!u || u.role !== 'admin') return { success: false, errMsg: '无权限' };
  }

  switch (event.type) {
    case 'getStats':       return getStats();
    case 'getMerchants':   return getMerchants(event);
    case 'getUsers':       return getUsers(event);
    case 'getOrders':      return getOrders(event);
    case 'banUser':        return banUser(event);
    case 'setUserRole':    return setUserRole(event);
    case 'publishNotice':  return publishNotice(event, OPENID);
    case 'resolveDispute': return resolveDispute(event);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

const PAGE_SIZE = 20;

async function getStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [allOrders, todayOrders, merchants, users] = await Promise.all([
      db.collection('orders').count(),
      db.collection('orders').where({ created_at: _.gte(today) }).get(),
      db.collection('merchants').where({ status: 'open' }).count(),
      db.collection('users').where({ role: 'delivery', status: 'active' }).count(),
    ]);

    const todayRevenue = todayOrders.data
      .filter(o => !['pending','cancelled'].includes(o.status))
      .reduce((s, o) => s + o.total_amount, 0);

    return {
      success: true,
      data: {
        totalOrders: allOrders.total,
        todayOrders: todayOrders.data.length,
        todayRevenue,
        activeMerchants: merchants.total,
        activeDelivery: users.total,
      },
    };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getMerchants(event) {
  const { page = 0 } = event;
  try {
    const res = await db.collection('merchants')
      .orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getUsers(event) {
  const { page = 0, role } = event;
  try {
    let query = db.collection('users');
    if (role) query = query.where({ role });
    const res = await query.orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getOrders(event) {
  const { page = 0, status } = event;
  try {
    let query = db.collection('orders');
    if (status && status !== 'all') query = query.where({ status });
    const res = await query.orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function banUser(event) {
  const { userId, action } = event; // action: 'ban' | 'unban'
  try {
    await db.collection('users').doc(userId).update({
      data: { status: action === 'ban' ? 'banned' : 'active' },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function setUserRole(event) {
  const { userId, role } = event;
  try {
    await db.collection('users').doc(userId).update({ data: { role } });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function publishNotice(event, openid) {
  try {
    await db.collection('notices').add({
      data: {
        title: event.title,
        content: event.content,
        type: event.noticeType || 'announcement',
        is_active: true,
        created_by: openid,
        expires_at: event.expiresAt ? new Date(event.expiresAt) : null,
        created_at: db.serverDate(),
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function resolveDispute(event) {
  const { orderId, action } = event; // action: 'cancel' | 'complete'
  try {
    const status = action === 'cancel' ? 'cancelled' : 'completed';
    const timeField = action === 'cancel' ? 'cancelled_at' : 'completed_at';
    await db.collection('orders').doc(orderId).update({
      data: { status, [timeField]: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
