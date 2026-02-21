// pages/review/index.js
const api = require('../../utils/api');

Page({
  data: {
    orderId: '',
    merchantId: '',
    score: 5,
    content: '',
    stars: [1,2,3,4,5],
    submitting: false,
    aiLoading: false,
  },

  onLoad(options) {
    this.setData({ orderId: options.orderId, merchantId: options.merchantId });
  },

  onStarTap(e) {
    this.setData({ score: e.currentTarget.dataset.score });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onAiDraft() {
    this.setData({ aiLoading: true });
    api.call('ai', 'generateReviewDraft', {
      orderInfo: { merchantName: '', items: '' },
      score: this.data.score,
    }).then(res => {
      this.setData({ content: res.data, aiLoading: false });
    }).catch(() => this.setData({ aiLoading: false }));
  },

  onSubmit() {
    if (this.data.submitting) return;
    if (!this.data.content) return wx.showToast({ title: '请填写评价内容', icon: 'none' });
    this.setData({ submitting: true });
    api.call('review', 'create', {
      orderId: this.data.orderId,
      targetType: 'merchant',
      targetId: this.data.merchantId,
      score: this.data.score,
      content: this.data.content,
      images: [],
      isAiDraft: false,
    }).then(() => {
      wx.showToast({ title: '评价成功！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(() => this.setData({ submitting: false }));
  },
});
