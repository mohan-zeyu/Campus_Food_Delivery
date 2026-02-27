// cloudfunctions/order/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const type = (event.type || event.action || '').trim();
  switch (type) {
    case 'create':           return create(event, OPENID);
    case 'pay':              return pay(event, OPENID);
    case 'getList':          return getList(event, OPENID);
    case 'getDetail':        return getDetail(event, OPENID);
    case 'cancel':           return cancel(event, OPENID);
    case 'confirmDelivery':  return confirmDelivery(event, OPENID);
    case 'getByMerchant':    return getByMerchant(event, OPENID);
    case 'merchantConfirm':  return merchantConfirm(event, OPENID);
    default: return { success: false, errMsg: `Unknown type: ${type || 'undefined'}` };
  }
};

const PAGE_SIZE = 10;

function _generateOrderNo() {
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  return `CE${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${Date.now().toString().slice(-6)}`;
}

// ── 创建订单（带事务：检查库存 → 扣减 → 插入） ──────────────
async function create(event, openid) {
  const { merchantId, merchantName, deliveryAddress, deliveryZone, items, deliveryFee, deliveryTime } = event;
  const txn = await db.startTransaction();
  try {
    // 1. 校验并扣减库存
    let itemsTotal = 0;
    let packagingFee = 0;
    const orderItems = [];

    for (const item of items) {
      const p = await txn.collection('products').doc(item.product_id).get();
      const product = p.data;
      if (!product.is_available) throw new Error(`${product.name} 已下架`);
      if (product.inventory !== -1) {
        if (product.inventory < item.quantity) throw new Error(`${product.name} 库存不足`);
        await txn.collection('products').doc(item.product_id).update({
          data: { inventory: _.increment(-item.quantity) },
        });
      }
      const subtotal = product.price * item.quantity;
      itemsTotal += subtotal;
      packagingFee += product.packaging_fee * item.quantity;
      orderItems.push({
        product_id: item.product_id,
        product_name: product.name,
        product_image: product.images && product.images[0] ? product.images[0] : '',
        unit_price: product.price,
        quantity: item.quantity,
        remarks: item.remarks || '',
        subtotal,
      });
    }

    const totalAmount = itemsTotal + (deliveryFee || 0) + packagingFee;
    const orderNo = _generateOrderNo();
    const itemCount = orderItems.reduce((sum, oi) => sum + (Number(oi.quantity) || 0), 0);

    // 2. 插入订单
    const orderRes = await txn.collection('orders').add({
      data: {
        order_no: orderNo,
        _openid: openid,
        user_id: openid,
        merchant_id: merchantId,
        merchant_name: merchantName,
        delivery_address: deliveryAddress,
        delivery_zone: deliveryZone,
        delivery_time: deliveryTime || '立即配送',
        items_total: itemsTotal,
        item_count: itemCount,
        delivery_fee: deliveryFee || 0,
        packaging_fee: packagingFee,
        total_amount: totalAmount,
        status: 'pending',
        delivery_staff_openid: null,
        paid_at: null, accepted_at: null, picked_up_at: null,
        delivered_at: null, completed_at: null, cancelled_at: null,
        is_reviewed: false,
        created_at: db.serverDate(),
      },
    });

    // 3. 插入订单项
    for (const oi of orderItems) {
      await txn.collection('order_items').add({
        data: { ...oi, order_id: orderRes._id, _openid: openid },
      });
    }

    await txn.commit();
    return { success: true, orderId: orderRes._id, orderNo };
  } catch (e) {
    await txn.rollback();
    return { success: false, errMsg: e.message };
  }
}

// ── 模拟支付 ────────────────────────────────────────────────
async function pay(event, openid) {
  const order = await db.collection('orders').doc(event.orderId).get();
  const o = order.data;
  if (o._openid !== openid) return { success: false, errMsg: '无权限' };
  if (o.status !== 'pending') return { success: false, errMsg: '订单状态不可支付' };
  try {
    await db.collection('orders').doc(event.orderId).update({
      data: { status: 'paid', paid_at: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 获取订单列表 ─────────────────────────────────────────────
async function getList(event, openid) {
  const { status, page = 0 } = event;
  try {
    let query = db.collection('orders').where({ _openid: openid });
    if (status && status !== 'all') query = query.where({ status });
    const res = await query.orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();

    // 为缺少 item_count 的旧订单补充商品数量
    const orders = res.data;
    const needCount = orders.filter(o => o.item_count === undefined || o.item_count === null);
    if (needCount.length > 0) {
      const countMap = {};
      for (const o of needCount) {
        const items = await db.collection('order_items').where({ order_id: o._id }).get();
        countMap[o._id] = items.data.reduce((sum, oi) => sum + (Number(oi.quantity) || 0), 0);
      }
      for (const o of orders) {
        if (countMap[o._id] !== undefined) o.item_count = countMap[o._id];
      }
    }

    return { success: true, data: orders, hasMore: orders.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 获取订单详情 ─────────────────────────────────────────────
async function getDetail(event, openid) {
  try {
    const [order, items] = await Promise.all([
      db.collection('orders').doc(event.orderId).get(),
      db.collection('order_items').where({ order_id: event.orderId }).get(),
    ]);
    return { success: true, data: { ...order.data, items: items.data } };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 取消订单 ────────────────────────────────────────────────
async function cancel(event, openid) {
  const order = await db.collection('orders').doc(event.orderId).get();
  const o = order.data;
  if (o._openid !== openid) return { success: false, errMsg: '无权限' };
  if (!['pending', 'paid'].includes(o.status)) {
    return { success: false, errMsg: '当前状态不可取消' };
  }
  const txn = await db.startTransaction();
  try {
    // 恢复库存
    const items = await txn.collection('order_items').where({ order_id: event.orderId }).get();
    for (const oi of items.data) {
      const p = await txn.collection('products').doc(oi.product_id).get();
      if (p.data && p.data.inventory !== -1) {
        await txn.collection('products').doc(oi.product_id).update({
          data: { inventory: _.increment(oi.quantity) },
        });
      }
    }
    await txn.collection('orders').doc(event.orderId).update({
      data: { status: 'cancelled', cancelled_at: db.serverDate() },
    });
    await txn.commit();
    return { success: true };
  } catch (e) {
    await txn.rollback();
    return { success: false, errMsg: e.message };
  }
}

// ── 用户确认收货 ─────────────────────────────────────────────
async function confirmDelivery(event, openid) {
  const order = await db.collection('orders').doc(event.orderId).get();
  const o = order.data;
  if (o._openid !== openid) return { success: false, errMsg: '无权限' };
  if (o.status !== 'delivered') return { success: false, errMsg: '订单尚未送达' };
  try {
    await db.collection('orders').doc(event.orderId).update({
      data: { status: 'completed', completed_at: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 商家视角获取订单列表 ─────────────────────────────────────
async function getByMerchant(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u || !['merchant', 'admin'].includes(u.role)) {
    return { success: false, errMsg: '无权限' };
  }
  const { merchantId, status, page = 0 } = event;
  try {
    let query = db.collection('orders').where({ merchant_id: merchantId });
    if (status && status !== 'all') query = query.where({ status });
    const res = await query.orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 商家确认接单 ─────────────────────────────────────────────
async function merchantConfirm(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u || u.role !== 'merchant') return { success: false, errMsg: '无权限' };
  const order = await db.collection('orders').doc(event.orderId).get();
  if (order.data.status !== 'paid') return { success: false, errMsg: '订单状态异常' };
  try {
    await db.collection('orders').doc(event.orderId).update({
      data: { status: 'accepted', accepted_at: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
