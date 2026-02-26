// pages/delivery-order-detail/index.js
const api = require('../../utils/api');
const notify = require('../../utils/notify');

Page({
  data: {
    order: null,
    loading: true,
    actionLoading: false,
    proofImage: '',
  },

  onLoad(options) {
    this.orderId = options.id;
    this.loadOrder();
  },

  loadOrder() {
    api.call('order', 'getDetail', { orderId: this.orderId }).then(res => {
      this.setData({ order: res.data, loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onAccept() {
    this.setData({ actionLoading: true });
    api.call('delivery', 'acceptOrder', { orderId: this.orderId }).then(() => {
      notify.subscribeDeliveryUpdates();
      wx.showToast({ title: '接单成功！', icon: 'success' });
      this.loadOrder();
    }).catch(() => this.setData({ actionLoading: false }));
  },

  onPickUp() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'pickUp' }).then(() => {
      wx.showToast({ title: '已取餐', icon: 'success' });
      this.loadOrder();
    });
  },

  onDispatch() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'dispatch' }).then(() => {
      wx.showToast({ title: '配送中', icon: 'success' });
      this.loadOrder();
    });
  },

  onChooseProof() {
    const orderId = this.orderId;
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        const timestamp = Date.now();
        const cloudPath = `delivery-proof/${orderId}_${timestamp}.jpg`;

        wx.showLoading({ title: '上传中...' });

        wx.cloud.uploadFile({
          cloudPath: cloudPath,
          filePath: tempFilePath,
          success: (uploadRes) => {
            const fileID = uploadRes.fileID;
            this.setData({ proofImage: fileID });

            api.call('delivery', 'uploadProof', {
              orderId: orderId,
              proofImage: fileID,
            }).then(() => {
              wx.hideLoading();
              wx.showToast({ title: '凭证已上传', icon: 'success' });
            }).catch(() => {
              wx.hideLoading();
              wx.showToast({ title: '保存失败，请重试', icon: 'none' });
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '上传失败，请重试', icon: 'none' });
          },
        });
      },
    });
  },

  onPreviewProof() {
    if (this.data.proofImage) {
      wx.previewImage({
        urls: [this.data.proofImage],
        current: this.data.proofImage,
      });
    }
  },

  onDeliver() {
    if (!this.data.proofImage) {
      wx.showModal({
        title: '尚未上传送达凭证',
        content: '建议拍摄送达凭证以避免纠纷，是否继续确认送达？',
        confirmText: '继续送达',
        cancelText: '去拍摄',
        success: (res) => {
          if (res.confirm) {
            this._confirmDeliver();
          }
        },
      });
      return;
    }
    this._confirmDeliver();
  },

  _confirmDeliver() {
    api.call('delivery', 'updateStatus', { orderId: this.orderId, action: 'deliver' }).then(() => {
      wx.showToast({ title: '已送达', icon: 'success' });
      this.loadOrder();
    });
  },
});
