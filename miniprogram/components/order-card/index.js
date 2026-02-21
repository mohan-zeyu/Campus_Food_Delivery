// components/order-card/index.js
Component({
  properties: {
    order: { type: Object, value: {} },
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { orderId: this.properties.order._id });
    },
  },
});
