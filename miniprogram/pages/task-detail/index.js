// pages/task-detail/index.js — 任务详情
const api = require('../../utils/api');
const { TASK_STATUS_LABEL } = require('../../utils/constants');

Page({
  data: {
    task: null,
    loading: true,
    isOwner: false,
    isAcceptor: false,
  },

  onLoad(options) {
    this.taskId = options.id;
    this.loadDetail();
  },

  loadDetail() {
    this.setData({ loading: true });
    api.call('task', 'getDetail', { taskId: this.taskId }).then(res => {
      const task = res.data;
      const openid = getApp().globalData.openid;
      this.setData({
        task: { ...task, statusLabel: TASK_STATUS_LABEL[task.status] || task.status },
        loading: false,
        isOwner: task._openid === openid,
        isAcceptor: task.accepted_by === openid,
      });
    }).catch(() => this.setData({ loading: false }));
  },

  onAccept() {
    wx.showModal({
      title: '接取任务',
      content: '确定接取此任务？',
      success: res => {
        if (res.confirm) {
          api.call('task', 'accept', { taskId: this.taskId }).then(() => {
            wx.showToast({ title: '接取成功', icon: 'success' });
            this.loadDetail();
          });
        }
      },
    });
  },

  onComplete() {
    wx.showModal({
      title: '完成任务',
      content: '确认任务已完成？',
      success: res => {
        if (res.confirm) {
          api.call('task', 'complete', { taskId: this.taskId }).then(() => {
            wx.showToast({ title: '已完成', icon: 'success' });
            this.loadDetail();
          });
        }
      },
    });
  },

  onCancel() {
    wx.showModal({
      title: '取消任务',
      content: '确定取消此任务？',
      success: res => {
        if (res.confirm) {
          api.call('task', 'cancel', { taskId: this.taskId }).then(() => {
            wx.showToast({ title: '已取消', icon: 'success' });
            this.loadDetail();
          });
        }
      },
    });
  },

  onPreviewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({ current: url, urls: this.data.task.images });
  },
});
