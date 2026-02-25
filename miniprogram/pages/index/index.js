// pages/index/index.js
const api = require('../../utils/api');
const { CAMPUS_ZONE_LABEL } = require('../../utils/constants');

Page({
  data: {
    merchants: [],
    notices: [],
    loading: true,
    hasMore: true,
    page: 0,
    selectedZone: '',
    keyword: '',
    zones: [
      { value: '', label: '全部' },
      { value: 'east', label: '东区' },
      { value: 'west', label: '西区' },
      { value: 'north', label: '北区' },
      { value: 'south', label: '南区' },
    ],
    noticeIndex: 0,
  },

  onLoad() {
    const app = getApp();
    if (!app.globalData.isLoaded && !app.globalData.openid) {
      // 未登录，跳转登录页
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }
    this.loadMerchants(true);
  },

  onShow() {
    // 刷新数据
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onPullDownRefresh() {
    this.loadMerchants(true).then(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMerchants(false);
    }
  },

  loadMerchants(reset = false) {
    const page = reset ? 0 : this.data.page;
    if (reset) this.setData({ loading: true, page: 0, merchants: [] });
    return api.call('merchant', 'getList', {
      page,
      zone: this.data.selectedZone,
      keyword: this.data.keyword,
    }).then(res => {
      const merchants = reset ? res.data : [...this.data.merchants, ...res.data];
      this.setData({
        merchants,
        notices: res.notices || [],
        loading: false,
        hasMore: res.hasMore,
        page: page + 1,
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  onZoneChange(e) {
    const zone = this.data.zones[e.currentTarget.dataset.index].value;
    this.setData({ selectedZone: zone });
    this.loadMerchants(true);
  },

  onSearch() {
    wx.navigateTo({ url: '/pages/search/index' });
  },

  onMerchantTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/merchant-detail/index?id=${id}` });
  },

  onNoticeChange(e) {
    this.setData({ noticeIndex: e.detail.current });
  },
});
