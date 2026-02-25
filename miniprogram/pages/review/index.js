// pages/review/index.js
const api = require('../../utils/api');

Page({
  data: {
    orderId: '',
    merchantId: '',
    score: 5,
    content: '',
    stars: [1, 2, 3, 4, 5],
    submitting: false,
    aiLoading: false,
    images: [],
  },

  _uploadedImages: [],
  _isAiDraft: false,

  onLoad(options) {
    this.setData({ orderId: options.orderId, merchantId: options.merchantId });
  },

  onStarTap(e) {
    this.setData({ score: e.currentTarget.dataset.score });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
    // User manually edited, no longer a pure AI draft
    this._isAiDraft = false;
  },

  onAiDraft() {
    this.setData({ aiLoading: true });
    api.call('ai', 'generateReviewDraft', {
      orderInfo: { merchantName: '', items: '' },
      score: this.data.score,
    }).then(res => {
      this._isAiDraft = true;
      this.setData({ content: res.data, aiLoading: false });
    }).catch(() => this.setData({ aiLoading: false }));
  },

  onChooseImage() {
    const remaining = 3 - this.data.images.length;
    if (remaining <= 0) {
      return wx.showToast({ title: '最多上传3张图片', icon: 'none' });
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath);
        this.setData({
          images: this.data.images.concat(newPaths),
        });
      },
    });
  },

  onRemoveImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.slice();
    images.splice(index, 1);
    // Also remove from uploaded cache if it exists
    if (this._uploadedImages.length > index) {
      this._uploadedImages.splice(index, 1);
    }
    this.setData({ images });
  },

  _uploadImages() {
    const { images, orderId } = this.data;
    if (!images.length) return Promise.resolve([]);

    const timestamp = Date.now();
    const tasks = images.map((filePath, index) => {
      const cloudPath = `review-images/${orderId}_${index}_${timestamp}.jpg`;
      return wx.cloud.uploadFile({
        cloudPath,
        filePath,
      }).then(res => res.fileID);
    });

    return Promise.all(tasks);
  },

  onSubmit() {
    if (this.data.submitting) return;
    if (!this.data.content) {
      return wx.showToast({ title: '请填写评价内容', icon: 'none' });
    }

    this.setData({ submitting: true });

    this._uploadImages().then(fileIDs => {
      return api.call('review', 'create', {
        orderId: this.data.orderId,
        targetType: 'merchant',
        targetId: this.data.merchantId,
        score: this.data.score,
        content: this.data.content,
        images: fileIDs,
        isAiDraft: this._isAiDraft,
      });
    }).then(() => {
      wx.showToast({ title: '评价成功！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(() => {
      this.setData({ submitting: false });
    });
  },
});
