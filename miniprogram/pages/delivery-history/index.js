// pages/delivery-history/index.js
const api = require('../../utils/api');

Page({
  data: {
    history: [],
    earnings: { total: 0, count: 0 },
    loading: true,
    hasMore: true,
    page: 0,
  },

  onLoad() {
    this.loadData();
  },

  onPullDownRefresh() {
    this.loadData().then(() => wx.stopPullDownRefresh());
  },

  loadData() {
    this.setData({ loading: true });
    return Promise.all([
      api.call('delivery', 'getHistory', { page: 0 }),
      api.call('delivery', 'getEarnings'),
    ]).then(([histRes, earnRes]) => {
      const history = (histRes.data || []).map(d => ({
        ...d,
        shortId: d.order_id ? d.order_id.slice(-6) : '------',
      }));
      this.setData({
        history,
        earnings: { total: earnRes.total || 0, count: earnRes.count || 0 },
        hasMore: histRes.hasMore,
        page: 1,
        loading: false,
      });
    }).catch(() => this.setData({ loading: false }));
  },
});
