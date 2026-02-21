// cloudfunctions/delivery/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch (event.type) {
    case 'getAvailableOrders': return getAvailableOrders(event);
    case 'acceptOrder':        return acceptOrder(event, OPENID);
    case 'updateStatus':       return updateStatus(event, OPENID);
    case 'uploadProof':        return uploadProof(event, OPENID);
    case 'getHistory':         return getHistory(event, OPENID);
    case 'getEarnings':        return getEarnings(event, OPENID);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

const PAGE_SIZE = 10;

async function getAvailableOrders(event) {
  try {
    const res = await db.collection('orders')
      .where({ status: 'paid' })
      .orderBy('paid_at', 'asc')
      .limit(30).get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function acceptOrder(event, openid) {
  const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
  const u = user.data[0];
  if (!u || u.role !== 'delivery') return { success: false, errMsg: '无权限' };

  const txn = await db.startTransaction();
  try {
    const order = await txn.collection('orders').doc(event.orderId).get();
    if (order.data.status !== 'paid') throw new Error('订单已被抢单');

    await txn.collection('orders').doc(event.orderId).update({
      data: {
        status: 'accepted',
        accepted_at: db.serverDate(),
        delivery_staff_openid: openid,
      },
    });

    // 计算配送费（简化：固定 200 fen）
    const deliveryFee = order.data.delivery_fee || 200;

    await txn.collection('deliveries').add({
      data: {
        order_id: event.orderId,
        _openid: openid,
        delivery_staff_id: openid,
        accepted_at: db.serverDate(),
        picked_up_at: null,
        dispatched_at: null,
        delivered_at: null,
        delivery_proof_image: null,
        delivery_fee_earned: deliveryFee,
        status: 'accepted',
      },
    });

    await txn.commit();
    return { success: true };
  } catch (e) {
    await txn.rollback();
    return { success: false, errMsg: e.message };
  }
}

async function updateStatus(event, openid) {
  const { orderId, action } = event;
  // action: 'pickUp' | 'dispatch' | 'deliver'
  const statusMap = {
    pickUp:   { orderStatus: 'picking_up', deliveryStatus: 'picking_up', timeField: 'picked_up_at' },
    dispatch: { orderStatus: 'in_transit', deliveryStatus: 'in_transit', timeField: 'dispatched_at' },
    deliver:  { orderStatus: 'delivered',  deliveryStatus: 'delivered',  timeField: 'delivered_at' },
  };
  const mapping = statusMap[action];
  if (!mapping) return { success: false, errMsg: '无效操作' };

  const order = await db.collection('orders').doc(orderId).get();
  if (order.data.delivery_staff_openid !== openid) return { success: false, errMsg: '无权限' };

  try {
    await db.collection('orders').doc(orderId).update({
      data: { status: mapping.orderStatus, [mapping.timeField]: db.serverDate() },
    });
    const delivery = await db.collection('deliveries').where({ order_id: orderId }).limit(1).get();
    if (delivery.data[0]) {
      await db.collection('deliveries').doc(delivery.data[0]._id).update({
        data: { status: mapping.deliveryStatus, [mapping.timeField]: db.serverDate() },
      });
    }
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function uploadProof(event, openid) {
  const delivery = await db.collection('deliveries')
    .where({ order_id: event.orderId, _openid: openid }).limit(1).get();
  if (!delivery.data[0]) return { success: false, errMsg: '无权限' };
  try {
    await db.collection('deliveries').doc(delivery.data[0]._id).update({
      data: { delivery_proof_image: event.fileId },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getHistory(event, openid) {
  const { page = 0 } = event;
  try {
    const res = await db.collection('deliveries')
      .where({ _openid: openid })
      .orderBy('accepted_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function getEarnings(event, openid) {
  try {
    const res = await db.collection('deliveries')
      .where({ _openid: openid, status: 'delivered' }).get();
    const total = res.data.reduce((s, d) => s + (d.delivery_fee_earned || 0), 0);
    return { success: true, total, count: res.data.length };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
