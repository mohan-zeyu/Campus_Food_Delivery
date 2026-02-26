// pages/index/index.js
const api = require('../../utils/api');
const { CAMPUS_ZONE_LABEL, TASK_STATUS_LABEL } = require('../../utils/constants');

Page({
  data: {
    activeMainTab: 'merchants',
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
    // 任务相关
    tasks: [],
    tasksLoading: false,
    tasksHasMore: true,
    tasksPage: 0,
  },

  onLoad() {
    const app = getApp();
    if (!app.globalData.isLoaded && !app.globalData.openid) {
      wx.redirectTo({ url: '/pages/login/index' });
      return;
    }
    this.loadMerchants(true);
  },

  onShow() {
    if (typeof this.getTabBar === 'function') {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  onPullDownRefresh() {
    if (this.data.activeMainTab === 'merchants') {
      this.loadMerchants(true).then(() => wx.stopPullDownRefresh());
    } else {
      this.loadTasks(true).then(() => wx.stopPullDownRefresh());
    }
  },

  onReachBottom() {
    if (this.data.activeMainTab === 'merchants') {
      if (this.data.hasMore && !this.data.loading) this.loadMerchants(false);
    } else {
      if (this.data.tasksHasMore && !this.data.tasksLoading) this.loadTasks(false);
    }
  },

  onMainTabChange(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeMainTab: tab });
    if (tab === 'tasks' && this.data.tasks.length === 0) {
      this.loadTasks(true);
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

  loadTasks(reset = false) {
    const page = reset ? 0 : this.data.tasksPage;
    if (reset) this.setData({ tasksLoading: true, tasksPage: 0, tasks: [] });
    else this.setData({ tasksLoading: true });

    return api.call('task', 'getList', { status: 'open', page }).then(res => {
      const tasks = reset ? res.data : [...this.data.tasks, ...res.data];
      this.setData({
        tasks: tasks.map(t => ({ ...t, statusLabel: TASK_STATUS_LABEL[t.status] || t.status })),
        tasksLoading: false,
        tasksHasMore: res.hasMore,
        tasksPage: page + 1,
      });
    }).catch(() => {
      this.setData({ tasksLoading: false });
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

  onTaskTap(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/task-detail/index?id=${id}` });
  },

  onNoticeChange(e) {
    this.setData({ noticeIndex: e.detail.current });
  },
});
