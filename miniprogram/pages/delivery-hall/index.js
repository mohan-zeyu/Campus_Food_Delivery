// pages/delivery-hall/index.js — 服务中心
Page({
  data: {
    services: [
      { icon: '🛵', label: '接单大厅', url: '/pages/delivery-orders/index', type: 'navigate' },
      { icon: '📝', label: '发布任务', url: '/pages/create-task/index', type: 'navigate' },
      { icon: '📋', label: '我的订单', url: '/pages/order-list/index', type: 'switchTab' },
      { icon: '📍', label: '收货地址', url: '/pages/address-list/index', type: 'navigate' },
      { icon: '💰', label: '配送收益', url: '/pages/delivery-history/index', type: 'navigate' },
      { icon: '💬', label: '意见反馈', url: '/pages/feedback/index', type: 'navigate' },
      { icon: '🔍', label: '搜索', url: '/pages/search/index', type: 'navigate' },
      { icon: '👤', label: '个人中心', url: '/pages/profile/index', type: 'switchTab' },
    ],
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 2 });
    }
  },

  onServiceTap(e) {
    const { url, type } = e.currentTarget.dataset;
    if (type === 'switchTab') {
      wx.switchTab({ url });
    } else {
      wx.navigateTo({ url });
    }
  },
});
