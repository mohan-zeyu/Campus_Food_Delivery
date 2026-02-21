// pages/address-edit/index.js
const api = require('../../utils/api');

Page({
  data: {
    isEdit: false,
    addressId: '',
    form: {
      label: '宿舍',
      building: '',
      room: '',
      contact: '',
      phone: '',
      campus_zone: 'east',
      is_default: false,
    },
    labelOptions: ['宿舍', '教室', '办公室', '其他'],
    zoneOptions: [
      { label: '东区', value: 'east' },
      { label: '西区', value: 'west' },
      { label: '北区', value: 'north' },
      { label: '南区', value: 'south' },
    ],
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id });
      this.loadAddress(options.id);
    }
  },

  loadAddress(id) {
    api.call('user', 'getAddresses').then(res => {
      const addr = res.data.find(a => a._id === id);
      if (addr) {
        this.setData({
          form: {
            label: addr.label,
            building: addr.building,
            room: addr.room,
            contact: addr.contact,
            phone: addr.phone,
            campus_zone: addr.campus_zone,
            is_default: addr.is_default,
          },
        });
      }
    });
  },

  onInput(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  onLabelChange(e) {
    this.setData({ 'form.label': this.data.labelOptions[e.detail.value] });
  },

  onZoneChange(e) {
    this.setData({ 'form.campus_zone': this.data.zoneOptions[e.detail.value].value });
  },

  onDefaultToggle() {
    this.setData({ 'form.is_default': !this.data.form.is_default });
  },

  onSave() {
    const { form, isEdit, addressId } = this.data;
    if (!form.building || !form.room || !form.contact || !form.phone) {
      return wx.showToast({ title: '请填写完整信息', icon: 'none' });
    }
    const action = isEdit ? 'updateAddress' : 'addAddress';
    const data = isEdit ? { id: addressId, ...form } : form;
    api.call('user', action, data).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    });
  },
});
