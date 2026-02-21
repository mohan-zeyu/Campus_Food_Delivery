// components/cart-bar/index.js
Component({
  properties: {
    itemCount: { type: Number, value: 0 },
    totalAmount: { type: Number, value: 0 },
    minOrder: { type: Number, value: 0 },
  },
  methods: {
    onTap() {
      if (this.properties.itemCount === 0) return;
      this.triggerEvent('tap');
    },
  },
});
