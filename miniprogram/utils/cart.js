// utils/cart.js
// 购物车全部存本地 localStorage，不上云

const CART_KEY = 'campus_eats_cart';

const cart = {
  /**
   * 获取当前购物车
   * @returns {{ merchant_id, merchant_name, items: Array }|null}
   */
  get() {
    return wx.getStorageSync(CART_KEY) || null;
  },

  /**
   * 保存购物车
   */
  save(data) {
    wx.setStorageSync(CART_KEY, data);
  },

  /**
   * 清空购物车
   */
  clear() {
    wx.removeStorageSync(CART_KEY);
  },

  /**
   * 添加商品到购物车
   * 如果来自不同商家，弹确认框后再切换
   * @param {object} product     { _id, merchant_id, merchant_name, name, images, price, packaging_fee }
   * @param {number} quantity    加几个
   * @param {string} remarks     备注
   * @returns {Promise<boolean>} 是否成功添加
   */
  addItem(product, quantity = 1, remarks = '') {
    const current = this.get();

    const doAdd = () => {
      let c = this.get() || {
        merchant_id: product.merchant_id,
        merchant_name: product.merchant_name,
        items: [],
      };
      const idx = c.items.findIndex(
        i => i.product_id === product._id && i.remarks === remarks
      );
      if (idx >= 0) {
        c.items[idx].quantity += quantity;
        c.items[idx].subtotal = c.items[idx].quantity * c.items[idx].unit_price;
      } else {
        c.items.push({
          product_id: product._id,
          name: product.name,
          image: (product.images && product.images[0]) || '',
          unit_price: product.price,
          packaging_fee: product.packaging_fee || 0,
          quantity,
          remarks,
          subtotal: product.price * quantity,
        });
      }
      this.save(c);
    };

    if (current && current.merchant_id !== product.merchant_id) {
      return new Promise((resolve) => {
        wx.showModal({
          title: '切换商家',
          content: '购物车中已有其他商家的商品，是否清空后重新选购？',
          confirmText: '清空',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              this.clear();
              doAdd();
              resolve(true);
            } else {
              resolve(false);
            }
          },
        });
      });
    }
    doAdd();
    return Promise.resolve(true);
  },

  /**
   * 更新某个商品数量（quantity=0 则删除）
   */
  updateQuantity(productId, remarks, quantity) {
    const c = this.get();
    if (!c) return;
    const idx = c.items.findIndex(
      i => i.product_id === productId && i.remarks === remarks
    );
    if (idx < 0) return;
    if (quantity <= 0) {
      c.items.splice(idx, 1);
    } else {
      c.items[idx].quantity = quantity;
      c.items[idx].subtotal = quantity * c.items[idx].unit_price;
    }
    if (c.items.length === 0) {
      this.clear();
    } else {
      this.save(c);
    }
  },

  /**
   * 计算汇总
   */
  summary() {
    const c = this.get();
    if (!c || !c.items || c.items.length === 0) {
      return { itemCount: 0, itemsTotal: 0, packagingFee: 0 };
    }
    const itemCount = c.items.reduce((s, i) => s + i.quantity, 0);
    const itemsTotal = c.items.reduce((s, i) => s + i.subtotal, 0);
    const packagingFee = c.items.reduce((s, i) => s + i.packaging_fee * i.quantity, 0);
    return { itemCount, itemsTotal, packagingFee };
  },
};

module.exports = cart;
