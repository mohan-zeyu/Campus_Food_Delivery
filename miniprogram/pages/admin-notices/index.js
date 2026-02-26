// pages/admin-notices/index.js
const api = require('../../utils/api');
const auth = require('../../utils/auth');

Page({
  data: {
    notices: [],
    loading: true,
    showForm: false,
    form: { title: '', content: '', noticeType: 'announcement' },
    typeOptions: ['announcement', 'promotion', 'system'],
    typeLabelMap: { announcement: '通知', promotion: '活动', system: '系统' },
    typeIndex: 0,
    submitting: false,
  },

  onLoad() {
    if (!auth.guard('admin')) return;
    this.loadNotices();
  },

  loadNotices() {
    api.call('admin', 'getNotices').then(res => {
      this.setData({ notices: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onToggleForm() {
    this.setData({
      showForm: !this.data.showForm,
      form: { title: '', content: '', noticeType: 'announcement' },
      typeIndex: 0,
    });
  },

  onTitleInput(e) {
    this.setData({ 'form.title': e.detail.value });
  },

  onContentInput(e) {
    this.setData({ 'form.content': e.detail.value });
  },

  onTypeChange(e) {
    const idx = Number(e.detail.value);
    this.setData({
      typeIndex: idx,
      'form.noticeType': this.data.typeOptions[idx],
    });
  },

  onPublish() {
    const { form } = this.data;
    if (!form.title.trim()) return wx.showToast({ title: '请填写标题', icon: 'none' });
    if (!form.content.trim()) return wx.showToast({ title: '请填写内容', icon: 'none' });
    this.setData({ submitting: true });
    api.call('admin', 'publishNotice', {
      title: form.title,
      content: form.content,
      noticeType: form.noticeType,
    }).then(() => {
      wx.showToast({ title: '发布成功', icon: 'success' });
      this.setData({ showForm: false, submitting: false });
      this.loadNotices();
    }).catch(() => this.setData({ submitting: false }));
  },

  onToggleActive(e) {
    const { id, active } = e.currentTarget.dataset;
    const newActive = !active;
    api.call('admin', 'toggleNotice', { noticeId: id, isActive: newActive }).then(() => {
      wx.showToast({ title: newActive ? '已启用' : '已禁用', icon: 'success' });
      this.loadNotices();
    });
  },

  onDeleteNotice(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除公告',
      content: '确定删除该公告？',
      success: res => {
        if (res.confirm) {
          api.call('admin', 'deleteNotice', { noticeId: id }).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadNotices();
          });
        }
      },
    });
  },
});
