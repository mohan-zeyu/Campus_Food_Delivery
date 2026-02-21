// pages/admin-users/index.js
const api = require('../../utils/api');

Page({
  data: { users: [], loading: true, hasMore: true, page: 0 },
  onLoad() { this.loadUsers(true); },
  loadUsers(reset = false) {
    const page = reset ? 0 : this.data.page;
    if (reset) this.setData({ loading: true, page: 0 });
    return api.call('admin', 'getUsers', { page }).then(res => {
      const users = reset ? res.data : [...this.data.users, ...res.data];
      this.setData({ users, loading: false, hasMore: res.hasMore, page: page + 1 });
    }).catch(() => this.setData({ loading: false }));
  },
  onBan(e) {
    const { id, status } = e.currentTarget.dataset;
    const action = status === 'active' ? 'ban' : 'unban';
    api.call('admin', 'banUser', { userId: id, action }).then(() => this.loadUsers(true));
  },
  onSetRole(e) {
    const { id } = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['user', 'delivery', 'merchant', 'admin'],
      success: res => {
        const roles = ['user', 'delivery', 'merchant', 'admin'];
        api.call('admin', 'setUserRole', { userId: id, role: roles[res.tapIndex] }).then(() => this.loadUsers(true));
      },
    });
  },
});
