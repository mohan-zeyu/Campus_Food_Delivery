// pages/search/index.js
const api = require('../../utils/api');

Page({
  data: {
    keyword: '',
    results: [],
    loading: false,
    aiMode: false,
    aiSummary: '',
    searched: false,
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onSearch() {
    if (!this.data.keyword.trim()) return;
    this.setData({ loading: true, searched: true });

    if (this.data.aiMode) {
      api.call('ai', 'search', { query: this.data.keyword }).then(res => {
        this.setData({ results: res.data || [], aiSummary: res.aiSummary || '', loading: false });
      }).catch(() => this.setData({ loading: false }));
    } else {
      api.call('product', 'search', { keyword: this.data.keyword }).then(res => {
        this.setData({ results: res.data || [], loading: false });
      }).catch(() => this.setData({ loading: false }));
    }
  },

  onToggleMode() {
    this.setData({ aiMode: !this.data.aiMode, results: [], searched: false, aiSummary: '' });
  },

  onProductTap(e) {
    const { id, merchantId } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/product-detail/index?id=${id}&merchantId=${merchantId}` });
  },
});
