// pages/feedback/index.js
const api = require('../../utils/api');

Page({
  data: {
    types: ['服务投诉', '配送问题', '商品质量', '功能建议', '其他'],
    typeIndex: 0,
    content: '',
    images: [],
    submitting: false,
  },

  onTypeChange(e) {
    this.setData({ typeIndex: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onChooseImage() {
    if (this.data.images.length >= 3) return;
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      success: res => {
        const newPaths = res.tempFiles.map(f => f.tempFilePath);
        this.setData({ images: [...this.data.images, ...newPaths] });
      },
    });
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== idx);
    this.setData({ images });
  },

  async onSubmit() {
    if (this.data.submitting) return;
    if (!this.data.content.trim()) {
      return wx.showToast({ title: '请填写反馈内容', icon: 'none' });
    }
    this.setData({ submitting: true });

    try {
      // Upload images
      const imageIds = [];
      for (let i = 0; i < this.data.images.length; i++) {
        const res = await wx.cloud.uploadFile({
          cloudPath: `feedback/${Date.now()}_${i}.jpg`,
          filePath: this.data.images[i],
        });
        imageIds.push(res.fileID);
      }

      await api.call('user', 'submitFeedback', {
        feedbackType: this.data.types[this.data.typeIndex],
        content: this.data.content,
        images: imageIds,
      });

      wx.showToast({ title: '提交成功！', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      this.setData({ submitting: false });
    }
  },
});
