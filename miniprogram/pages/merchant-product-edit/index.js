// pages/merchant-product-edit/index.js
const api = require('../../utils/api');
const { PRODUCT_CATEGORIES } = require('../../utils/constants');

Page({
  data: {
    isEdit: false,
    productId: '',
    merchantId: '',
    form: { name: '', category: '主食', price: '', packaging_fee: '0', inventory: '-1', tags: '', is_available: true },
    categories: PRODUCT_CATEGORIES,
  },

  onLoad(options) {
    this.setData({ merchantId: options.merchantId });
    if (options.id) {
      this.setData({ isEdit: true, productId: options.id });
      this.loadProduct(options.id);
    }
  },

  loadProduct(id) {
    api.call('product', 'getDetail', { productId: id }).then(res => {
      const p = res.data;
      this.setData({
        form: {
          name: p.name, category: p.category,
          price: String(p.price / 100), packaging_fee: String(p.packaging_fee / 100),
          inventory: String(p.inventory), tags: p.tags.join(','), is_available: p.is_available,
        },
      });
    });
  },

  onInput(e) { this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value }); },
  onCategoryChange(e) { this.setData({ 'form.category': this.data.categories[e.detail.value] }); },
  onAvailableToggle() { this.setData({ 'form.is_available': !this.data.form.is_available }); },

  onSave() {
    const { form, isEdit, productId, merchantId } = this.data;
    if (!form.name || !form.price) return wx.showToast({ title: '请填写必填项', icon: 'none' });
    const data = {
      name: form.name, category: form.category,
      price: Math.round(parseFloat(form.price) * 100),
      packaging_fee: Math.round(parseFloat(form.packaging_fee || '0') * 100),
      inventory: parseInt(form.inventory || '-1'),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      is_available: form.is_available,
      merchant_id: merchantId,
    };
    const action = isEdit ? 'update' : 'create';
    if (isEdit) data.id = productId;
    api.call('product', action, data).then(() => {
      wx.showToast({ title: '保存成功', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1000);
    });
  },
});
