// pages/order-list/index.js
const api = require('../../utils/api');
const { statusLabel } = require('../../utils/format');

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: 'pending', label: '待支付' },
      { key: 'paid', label: '待接单' },
      { key: 'in_transit', label: '配送中' },
      { key: 'completed', label: '已完成' },
      { key: 'cancelled', label: '已取消' },
    ],
    activeTab: 'all',
    orders: [],
    loading: false,
    hasMore: true,
    page: 0,
  },

  onLoad() {
    this.loadOrders(true);
  },

  onShow() {
    this.loadOrders(true);
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  onPullDownRefresh() {
    this.loadOrders(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) this.loadOrders(false);
  },

  onTabChange(e) {
    this.setData({ activeTab: e.currentTarget.dataset.key });
    this.loadOrders(true);
  },

  loadOrders(reset = false) {
    const page = reset ? 0 : this.data.page;
    if (reset) this.setData({ loading: true, page: 0, orders: [] });
    else this.setData({ loading: true });

    return api.call('order', 'getList', {
      status: this.data.activeTab,
      page,
    }).then(res => {
      const orders = reset ? res.data : [...this.data.orders, ...res.data];
      this.setData({
        orders: orders.map(o => ({ ...o, statusLabel: statusLabel(o.status) })),
        loading: false,
        hasMore: res.hasMore,
        page: page + 1,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onOrderTap(e) {
    wx.navigateTo({ url: `/pages/order-detail/index?id=${e.currentTarget.dataset.id}` });
  },
});
