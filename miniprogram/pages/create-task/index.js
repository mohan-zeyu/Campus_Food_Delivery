// pages/create-task/index.js — 发布任务
const api = require('../../utils/api');

Page({
  data: {
    title: '',
    description: '',
    images: [],
    pickupLocation: '',
    deliveryLocation: '',
    rewardYuan: '',
    submitting: false,
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  onPickupInput(e) {
    this.setData({ pickupLocation: e.detail.value });
  },

  onDeliveryInput(e) {
    this.setData({ deliveryLocation: e.detail.value });
  },

  onRewardInput(e) {
    this.setData({ rewardYuan: e.detail.value });
  },

  onChooseImage() {
    if (this.data.images.length >= 3) {
      wx.showToast({ title: '最多上传3张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: 3 - this.data.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: res => {
        const newImages = res.tempFiles.map(f => f.tempFilePath);
        this.setData({ images: [...this.data.images, ...newImages] });
      },
    });
  },

  onRemoveImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.images.filter((_, i) => i !== idx);
    this.setData({ images });
  },

  async onSubmit() {
    const { title, description, pickupLocation, deliveryLocation, rewardYuan, images } = this.data;
    if (!title.trim()) return wx.showToast({ title: '请输入任务标题', icon: 'none' });
    if (!description.trim()) return wx.showToast({ title: '请输入任务描述', icon: 'none' });
    if (!rewardYuan || parseFloat(rewardYuan) <= 0) return wx.showToast({ title: '请设置有效报酬', icon: 'none' });

    this.setData({ submitting: true });

    try {
      // 上传图片到云存储
      const cloudImages = [];
      for (const img of images) {
        const ext = img.split('.').pop();
        const cloudPath = `task-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: img });
        cloudImages.push(uploadRes.fileID);
      }

      const reward = Math.round(parseFloat(rewardYuan) * 100); // 元→分
      await api.call('task', 'create', {
        title: title.trim(),
        description: description.trim(),
        images: cloudImages,
        pickupLocation: pickupLocation.trim(),
        deliveryLocation: deliveryLocation.trim(),
        reward,
      });

      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    } catch (e) {
      // api.call already shows toast
    } finally {
      this.setData({ submitting: false });
    }
  },
});
