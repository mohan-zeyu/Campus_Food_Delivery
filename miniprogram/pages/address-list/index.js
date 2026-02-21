// pages/address-list/index.js
const api = require('../../utils/api');

Page({
  data: {
    addresses: [],
    isSelect: false,
    loading: true,
  },

  onLoad(options) {
    this.setData({ isSelect: options.select === '1' });
    this.loadAddresses();
  },

  onShow() {
    this.loadAddresses();
  },

  loadAddresses() {
    api.call('user', 'getAddresses').then(res => {
      this.setData({ addresses: res.data || [], loading: false });
    }).catch(() => this.setData({ loading: false }));
  },

  onAddressTap(e) {
    const addr = e.currentTarget.dataset.addr;
    if (this.data.isSelect) {
      // 选择地址模式：传回参数给购物车页
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      if (prevPage) prevPage.setData({ selectedAddress: addr });
      wx.navigateBack();
    }
  },

  onSetDefault(e) {
    const { id } = e.currentTarget.dataset;
    api.call('user', 'setDefaultAddress', { id }).then(() => this.loadAddresses());
  },

  onEdit(e) {
    const { id } = e.currentTarget.dataset;
    wx.navigateTo({ url: `/pages/address-edit/index?id=${id}` });
  },

  onDelete(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '删除地址',
      content: '确定删除该地址？',
      success: res => {
        if (res.confirm) {
          api.call('user', 'deleteAddress', { id }).then(() => this.loadAddresses());
        }
      },
    });
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/address-edit/index' });
  },
});
