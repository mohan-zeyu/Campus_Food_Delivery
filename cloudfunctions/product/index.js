// cloudfunctions/product/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch (event.type) {
    case 'getList':          return getList(event);
    case 'getDetail':        return getDetail(event);
    case 'search':           return search(event);
    case 'create':           return create(event, OPENID);
    case 'update':           return update(event, OPENID);
    case 'updateInventory':  return updateInventory(event, OPENID);
    case 'toggleAvailable':  return toggleAvailable(event, OPENID);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

async function getList(event) {
  const { merchantId } = event;
  try {
    const res = await db.collection('products')
      .where({ merchant_id: merchantId, is_available: true })
      .orderBy('category', 'asc')
      .orderBy('created_at', 'asc')
      .get();
    // 按分类分组
    const grouped = {};
    for (const p of res.data) {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p);
    }
    const categories = Object.keys(grouped).map(name => ({
      name, products: grouped[name],
    }));
    return { success: true, data: res.data, categories };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getDetail(event) {
  try {
    const res = await db.collection('products').doc(event.productId).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function search(event) {
  const { keyword, category, minPrice, maxPrice, tags, page = 0 } = event;
  const PAGE_SIZE = 20;
  try {
    let query = db.collection('products').where({ is_available: true });
    if (keyword) query = query.where({ name: db.RegExp({ regexp: keyword, options: 'i' }) });
    if (category) query = query.where({ category });
    if (minPrice != null) query = query.where({ price: _.gte(minPrice) });
    if (maxPrice != null) query = query.where({ price: _.lte(maxPrice) });

    const res = await query.skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function _checkMerchantOwner(openid, merchantId) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u) return false;
  if (u.role === 'admin') return true;
  if (u.role === 'merchant') {
    const m = await db.collection('merchants').doc(merchantId).get();
    return m.data.owner_openid === openid;
  }
  return false;
}

async function create(event, openid) {
  const ok = await _checkMerchantOwner(openid, event.merchant_id);
  if (!ok) return { success: false, errMsg: '无权限' };
  try {
    const res = await db.collection('products').add({
      data: {
        merchant_id: event.merchant_id,
        name: event.name,
        category: event.category || '其他',
        price: event.price,
        packaging_fee: event.packaging_fee || 0,
        images: event.images || [],
        inventory: event.inventory != null ? event.inventory : -1,
        tags: event.tags || [],
        is_available: true,
        created_at: db.serverDate(),
      },
    });
    return { success: true, id: res._id };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function update(event, openid) {
  const product = await db.collection('products').doc(event.id).get();
  const ok = await _checkMerchantOwner(openid, product.data.merchant_id);
  if (!ok) return { success: false, errMsg: '无权限' };
  const { name, category, price, packaging_fee, images, inventory, tags } = event;
  const upd = {};
  if (name !== undefined) upd.name = name;
  if (category !== undefined) upd.category = category;
  if (price !== undefined) upd.price = price;
  if (packaging_fee !== undefined) upd.packaging_fee = packaging_fee;
  if (images !== undefined) upd.images = images;
  if (inventory !== undefined) upd.inventory = inventory;
  if (tags !== undefined) upd.tags = tags;
  try {
    await db.collection('products').doc(event.id).update({ data: upd });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function updateInventory(event, openid) {
  const product = await db.collection('products').doc(event.id).get();
  const ok = await _checkMerchantOwner(openid, product.data.merchant_id);
  if (!ok) return { success: false, errMsg: '无权限' };
  try {
    await db.collection('products').doc(event.id).update({
      data: { inventory: event.inventory },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function toggleAvailable(event, openid) {
  const product = await db.collection('products').doc(event.id).get();
  const ok = await _checkMerchantOwner(openid, product.data.merchant_id);
  if (!ok) return { success: false, errMsg: '无权限' };
  const newVal = !product.data.is_available;
  try {
    await db.collection('products').doc(event.id).update({
      data: { is_available: newVal },
    });
    return { success: true, is_available: newVal };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
