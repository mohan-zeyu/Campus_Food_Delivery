// components/loading-skeleton/index.js
Component({
  properties: {
    rows: { type: Number, value: 3 },
    type: { type: String, value: 'list' }, // 'list' | 'card'
  },
  data: {
    items: [],
  },
  lifetimes: {
    attached() {
      this.setData({ items: Array(this.properties.rows).fill(0) });
    },
  },
});
