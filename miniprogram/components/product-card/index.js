// components/product-card/index.js
Component({
  properties: {
    product: { type: Object, value: {} },
  },
  methods: {
    onTap() { this.triggerEvent('tap', { product: this.properties.product }); },
    onAdd(e) { e.stopPropagation(); this.triggerEvent('add', { product: this.properties.product }); },
  },
});
