// components/address-item/index.js
Component({
  properties: {
    address: { type: Object, value: {} },
    selected: { type: Boolean, value: false },
  },
  methods: {
    onTap() { this.triggerEvent('tap', { address: this.properties.address }); },
    onEdit(e) { e.stopPropagation(); this.triggerEvent('edit', { id: this.properties.address._id }); },
    onDelete(e) { e.stopPropagation(); this.triggerEvent('delete', { id: this.properties.address._id }); },
  },
});
