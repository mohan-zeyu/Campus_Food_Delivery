// components/cart-bar/index.js
Component({
  properties: {
    itemCount: { type: Number, value: 0 },
    totalAmount: { type: Number, value: 0 },
    minOrder: { type: Number, value: 0 },
  },
  observers: {
    'totalAmount, minOrder': function(totalAmount, minOrder) {
      if (totalAmount < minOrder) {
        const diff = ((minOrder - totalAmount) / 100).toFixed(2);
        this.setData({ checkoutText: '差¥' + diff + '起送' });
      } else {
        this.setData({ checkoutText: '去结算' });
      }
    },
  },
  data: {
    checkoutText: '去结算',
  },
  methods: {
    onTap() {
      if (this.properties.itemCount === 0) return;
      this.triggerEvent('tap');
    },
  },
});
