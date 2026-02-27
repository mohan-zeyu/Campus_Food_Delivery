// cloudfunctions/task/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const type = (event.type || event.action || '').trim();
  switch (type) {
    case 'create':        return create(event, OPENID);
    case 'getList':       return getList(event);
    case 'getDetail':     return getDetail(event);
    case 'accept':        return accept(event, OPENID);
    case 'complete':      return complete(event, OPENID);
    case 'cancel':        return cancel(event, OPENID);
    case 'getMyTasks':    return getMyTasks(event, OPENID);
    case 'getMyAccepted': return getMyAccepted(event, OPENID);
    default: return { success: false, errMsg: `Unknown type: ${type || 'undefined'}` };
  }
};

const PAGE_SIZE = 10;

// ── 创建任务 ──────────────────────────────────────────────
async function create(event, openid) {
  const { title, description, images, pickupLocation, deliveryLocation, reward } = event;
  if (!title || !description) return { success: false, errMsg: '请填写标题和描述' };
  if (!reward || reward <= 0) return { success: false, errMsg: '请设置有效的报酬金额' };
  try {
    // 获取发布者昵称
    const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
    const publisherName = user.data[0] ? user.data[0].nickname : '匿名用户';

    const res = await db.collection('tasks').add({
      data: {
        _openid: openid,
        publisher_name: publisherName,
        title,
        description,
        images: images || [],
        pickup_location: pickupLocation || '',
        delivery_location: deliveryLocation || '',
        reward,
        status: 'open',
        accepted_by: null,
        accepted_at: null,
        completed_at: null,
        created_at: db.serverDate(),
      },
    });
    return { success: true, taskId: res._id };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 获取任务列表 ──────────────────────────────────────────
async function getList(event) {
  const { status, page = 0 } = event;
  try {
    let query = db.collection('tasks');
    if (status && status !== 'all') {
      query = query.where({ status });
    }
    const res = await query.orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 获取任务详情 ──────────────────────────────────────────
async function getDetail(event) {
  try {
    const task = await db.collection('tasks').doc(event.taskId).get();
    return { success: true, data: task.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 接受任务（原子检查） ──────────────────────────────────
async function accept(event, openid) {
  try {
    const task = await db.collection('tasks').doc(event.taskId).get();
    if (task.data.status !== 'open') return { success: false, errMsg: '任务已被接取' };
    if (task.data._openid === openid) return { success: false, errMsg: '不能接取自己发布的任务' };

    // 获取接单者昵称
    const user = await db.collection('users').where({ _openid: openid }).limit(1).get();
    const acceptorName = user.data[0] ? user.data[0].nickname : '匿名用户';

    const res = await db.collection('tasks').doc(event.taskId).update({
      data: {
        status: 'accepted',
        accepted_by: openid,
        acceptor_name: acceptorName,
        accepted_at: db.serverDate(),
      },
    });
    if (res.stats.updated === 0) return { success: false, errMsg: '任务已被抢接' };
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 完成任务 ──────────────────────────────────────────────
async function complete(event, openid) {
  try {
    const task = await db.collection('tasks').doc(event.taskId).get();
    if (task.data.status !== 'accepted') return { success: false, errMsg: '任务状态异常' };
    // 发布者或接单者都可以标记完成
    if (task.data._openid !== openid && task.data.accepted_by !== openid) {
      return { success: false, errMsg: '无权限' };
    }
    await db.collection('tasks').doc(event.taskId).update({
      data: { status: 'completed', completed_at: db.serverDate() },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 取消任务 ──────────────────────────────────────────────
async function cancel(event, openid) {
  try {
    const task = await db.collection('tasks').doc(event.taskId).get();
    if (task.data._openid !== openid) return { success: false, errMsg: '无权限' };
    if (task.data.status !== 'open') return { success: false, errMsg: '只能取消未被接取的任务' };
    await db.collection('tasks').doc(event.taskId).update({
      data: { status: 'cancelled' },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 我发布的任务 ──────────────────────────────────────────
async function getMyTasks(event, openid) {
  const { page = 0 } = event;
  try {
    const res = await db.collection('tasks')
      .where({ _openid: openid })
      .orderBy('created_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 我接取的任务 ──────────────────────────────────────────
async function getMyAccepted(event, openid) {
  const { page = 0 } = event;
  try {
    const res = await db.collection('tasks')
      .where({ accepted_by: openid })
      .orderBy('accepted_at', 'desc')
      .skip(page * PAGE_SIZE).limit(PAGE_SIZE).get();
    return { success: true, data: res.data, hasMore: res.data.length === PAGE_SIZE };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
