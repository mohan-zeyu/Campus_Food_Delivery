// components/merchant-card/index.js
Component({
  properties: {
    merchant: { type: Object, value: {} },
  },
  methods: {
    onTap() { this.triggerEvent('tap', { merchantId: this.properties.merchant._id }); },
  },
});
