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
    case 'getNotices':     return getNotices(event);
    case 'toggleNotice':   return toggleNotice(event);
    case 'deleteNotice':   return deleteNotice(event);
    case 'resolveDispute': return resolveDispute(event);
    case 'getAdvancedStats': return getAdvancedStats();
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

// ── 公告管理 ────────────────────────────────────────────────
async function getNotices() {
  try {
    const res = await db.collection('notices')
      .orderBy('created_at', 'desc')
      .limit(50)
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function toggleNotice(event) {
  try {
    await db.collection('notices').doc(event.noticeId).update({
      data: { is_active: event.isActive },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function deleteNotice(event) {
  try {
    await db.collection('notices').doc(event.noticeId).remove();
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 高级统计 ────────────────────────────────────────────────
async function getAdvancedStats() {
  try {
    // 获取最近7天的订单
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const recentOrders = await db.collection('orders')
      .where({ created_at: _.gte(weekAgo) })
      .limit(1000)
      .get();

    const orders = recentOrders.data;

    // 1. 按小时统计订单量（高峰时段）
    const hourlyCount = {};
    for (let i = 0; i < 24; i++) hourlyCount[i] = 0;
    orders.forEach(o => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const h = d.getHours();
        hourlyCount[h] = (hourlyCount[h] || 0) + 1;
      }
    });
    const peakHours = Object.entries(hourlyCount)
      .map(([hour, count]) => ({ hour: Number(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 2. 热门商家（按订单量）
    const merchantCount = {};
    orders.forEach(o => {
      const name = o.merchant_name || '未知';
      merchantCount[name] = (merchantCount[name] || 0) + 1;
    });
    const popularMerchants = Object.entries(merchantCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 3. 取消率
    const totalCount = orders.length;
    const cancelledCount = orders.filter(o => o.status === 'cancelled').length;
    const cancelRate = totalCount > 0 ? Math.round(cancelledCount / totalCount * 100) : 0;

    // 4. 按日统计（最近7天趋势）
    const dailyStats = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = (d.getMonth() + 1) + '/' + d.getDate();
      dailyStats[key] = { orders: 0, revenue: 0 };
    }
    orders.forEach(o => {
      if (o.created_at) {
        const d = new Date(o.created_at);
        const key = (d.getMonth() + 1) + '/' + d.getDate();
        if (dailyStats[key]) {
          dailyStats[key].orders++;
          if (!['pending', 'cancelled'].includes(o.status)) {
            dailyStats[key].revenue += o.total_amount || 0;
          }
        }
      }
    });
    const dailyTrend = Object.entries(dailyStats).map(([date, s]) => ({
      date, orders: s.orders, revenue: s.revenue,
    }));

    return {
      success: true,
      data: { peakHours, popularMerchants, cancelRate, cancelledCount, totalCount, dailyTrend },
    };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
