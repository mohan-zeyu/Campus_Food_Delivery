// cloudfunctions/merchant/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch (event.type) {
    case 'getList':      return getList(event);
    case 'getDetail':    return getDetail(event);
    case 'create':       return create(event, OPENID);
    case 'update':       return update(event, OPENID);
    case 'toggleStatus': return toggleStatus(event, OPENID);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

const PAGE_SIZE = 10;

// ── 商家列表（带分区筛选 + 公告） ────────────────────────────
async function getList(event) {
  const { page = 0, zone, keyword } = event;
  try {
    let query = db.collection('merchants').where({ status: _.in(['open', 'closed']) });
    if (zone) query = query.where({ campus_zone: zone });
    if (keyword) query = query.where({ name: db.RegExp({ regexp: keyword, options: 'i' }) });

    const [merchants, notices] = await Promise.all([
      query.orderBy('avg_rating', 'desc')
           .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get(),
      db.collection('notices')
        .where({ is_active: true })
        .orderBy('created_at', 'desc')
        .limit(5).get(),
    ]);

    return {
      success: true,
      data: merchants.data,
      notices: notices.data,
      hasMore: merchants.data.length === PAGE_SIZE,
    };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 商家详情（含商品分类列表） ────────────────────────────────
async function getDetail(event) {
  const { merchantId } = event;
  try {
    const [merchantRes, productsRes] = await Promise.all([
      db.collection('merchants').doc(merchantId).get(),
      db.collection('products')
        .where({ merchant_id: merchantId, is_available: true })
        .orderBy('category', 'asc')
        .orderBy('created_at', 'asc')
        .get(),
    ]);

    const merchant = merchantRes.data;
    // 按分类分组
    const grouped = {};
    for (const p of productsRes.data) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }
    const categories = Object.keys(grouped).map(name => ({
      name,
      products: grouped[name],
    }));

    return { success: true, data: { merchant, categories } };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 创建商家（admin 用） ──────────────────────────────────────
async function create(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  if (!user.data[0] || user.data[0].role !== 'admin') {
    return { success: false, errMsg: '无权限' };
  }
  try {
    const res = await db.collection('merchants').add({
      data: {
        name: event.name,
        cover_image: event.cover_image || '',
        location: event.location || '',
        campus_zone: event.campus_zone || 'east',
        operating_hours: event.operating_hours || { open: '08:00', close: '21:00' },
        delivery_zones: event.delivery_zones || ['east', 'west', 'north', 'south'],
        delivery_fee_rules: event.delivery_fee_rules || [],
        min_order: event.min_order || 0,
        avg_rating: 5.0,
        rating_count: 0,
        status: 'open',
        owner_openid: event.owner_openid || '',
        created_at: db.serverDate(),
      },
    });
    return { success: true, id: res._id };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 更新商家信息 ─────────────────────────────────────────────
async function update(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u) return { success: false, errMsg: '用户不存在' };

  const merchant = await db.collection('merchants').doc(event.id).get();
  const m = merchant.data;
  if (u.role !== 'admin' && m.owner_openid !== openid) {
    return { success: false, errMsg: '无权限' };
  }
  const { name, cover_image, location, operating_hours, delivery_zones, delivery_fee_rules, min_order } = event;
  const update = {};
  if (name !== undefined) update.name = name;
  if (cover_image !== undefined) update.cover_image = cover_image;
  if (location !== undefined) update.location = location;
  if (operating_hours !== undefined) update.operating_hours = operating_hours;
  if (delivery_zones !== undefined) update.delivery_zones = delivery_zones;
  if (delivery_fee_rules !== undefined) update.delivery_fee_rules = delivery_fee_rules;
  if (min_order !== undefined) update.min_order = min_order;
  try {
    await db.collection('merchants').doc(event.id).update({ data: update });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 切换营业状态 ─────────────────────────────────────────────
async function toggleStatus(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u) return { success: false, errMsg: '用户不存在' };

  const merchant = await db.collection('merchants').doc(event.id).get();
  const m = merchant.data;
  if (u.role !== 'admin' && m.owner_openid !== openid) {
    return { success: false, errMsg: '无权限' };
  }
  const newStatus = m.status === 'open' ? 'closed' : 'open';
  try {
    await db.collection('merchants').doc(event.id).update({ data: { status: newStatus } });
    return { success: true, status: newStatus };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
