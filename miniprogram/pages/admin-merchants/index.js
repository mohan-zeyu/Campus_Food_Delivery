// pages/admin-merchants/index.js
const api = require('../../utils/api');
Page({
  data: { merchants: [], loading: true },
  onLoad() { this.load(); },
  load() {
    api.call('admin', 'getMerchants', { page: 0 }).then(res => {
      this.setData({ merchants: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },
  onToggle(e) {
    api.call('merchant', 'toggleStatus', { id: e.currentTarget.dataset.id }).then(() => this.load());
  },
});
