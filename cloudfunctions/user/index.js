// cloudfunctions/user/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const action = (event.type || event.action || '').trim();
  switch (action) {
    case 'login':             return login(OPENID);
    case 'getProfile':        return getProfile(OPENID);
    case 'updateProfile':     return updateProfile(event, OPENID);
    case 'getAddresses':      return getAddresses(OPENID);
    case 'addAddress':        return addAddress(event, OPENID);
    case 'updateAddress':     return updateAddress(event, OPENID);
    case 'deleteAddress':     return deleteAddress(event, OPENID);
    case 'setDefaultAddress': return setDefaultAddress(event, OPENID);
    case 'submitFeedback':    return submitFeedback(event, OPENID);
    default: return { success: false, errMsg: `Unknown type: ${action || 'undefined'}` };
  }
};

// ── 登录（首次自动注册） ──────────────────────────────────────
async function login(openid) {
  try {
    const col = db.collection('users');
    const existing = await col.where({ _openid: openid }).limit(1).get();
    let user;
    if (existing.data.length > 0) {
      user = existing.data[0];
      // 更新最后登录时间
      await col.doc(user._id).update({ data: { last_login: db.serverDate() } });
    } else {
      // 新用户注册
      const res = await col.add({
        data: {
          _openid: openid,
          nickname: '校园食递用户',
          avatar_url: '',
          phone: '',
          role: 'user',
          credit_score: 100,
          status: 'active',
          merchant_id: null,
          created_at: db.serverDate(),
          last_login: db.serverDate(),
        },
      });
      const newDoc = await col.doc(res._id).get();
      user = newDoc.data;
    }
    return { success: true, data: user };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 获取个人信息 ────────────────────────────────────────────
async function getProfile(openid) {
  try {
    const res = await db.collection('users').where({ _openid: openid }).limit(1).get();
    if (res.data.length === 0) return { success: false, errMsg: '用户不存在' };
    return { success: true, data: res.data[0] };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 更新个人信息 ────────────────────────────────────────────
async function updateProfile(event, openid) {
  const { nickname, avatar_url, phone } = event;
  const update = {};
  if (nickname !== undefined) update.nickname = nickname;
  if (avatar_url !== undefined) update.avatar_url = avatar_url;
  if (phone !== undefined) update.phone = phone;
  try {
    await db.collection('users').where({ _openid: openid }).update({ data: update });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 地址管理 ────────────────────────────────────────────────
async function getAddresses(openid) {
  try {
    const res = await db.collection('addresses')
      .where({ _openid: openid })
      .orderBy('is_default', 'desc')
      .orderBy('created_at', 'desc')
      .get();
    return { success: true, data: res.data };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function addAddress(event, openid) {
  const { label, building, room, contact, phone, campus_zone, is_default } = event;
  try {
    // 若新地址设为默认，先取消旧默认
    if (is_default) {
      await db.collection('addresses')
        .where({ _openid: openid, is_default: true })
        .update({ data: { is_default: false } });
    }
    const res = await db.collection('addresses').add({
      data: {
        _openid: openid,
        label: label || '其他',
        building,
        room,
        contact,
        phone,
        campus_zone: campus_zone || 'east',
        is_default: is_default || false,
        created_at: db.serverDate(),
      },
    });
    return { success: true, id: res._id };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function updateAddress(event, openid) {
  const { id, label, building, room, contact, phone, campus_zone, is_default } = event;
  try {
    if (is_default) {
      await db.collection('addresses')
        .where({ _openid: openid, is_default: true })
        .update({ data: { is_default: false } });
    }
    await db.collection('addresses').doc(id).update({
      data: { label, building, room, contact, phone, campus_zone, is_default },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function deleteAddress(event, openid) {
  try {
    await db.collection('addresses').doc(event.id).remove();
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function setDefaultAddress(event, openid) {
  try {
    await db.collection('addresses')
      .where({ _openid: openid, is_default: true })
      .update({ data: { is_default: false } });
    await db.collection('addresses').doc(event.id).update({
      data: { is_default: true },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

// ── 提交反馈 ──────────────────────────────────────────────────
async function submitFeedback(event, openid) {
  try {
    await db.collection('feedback').add({
      data: {
        _openid: openid,
        type: event.feedbackType,
        content: event.content,
        images: event.images || [],
        status: 'pending',
        created_at: db.serverDate(),
      },
    });
    return { success: true };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
