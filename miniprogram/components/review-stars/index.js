// components/review-stars/index.js
Component({
  properties: {
    score: { type: Number, value: 5 },
    readonly: { type: Boolean, value: false },
    size: { type: String, value: 'medium' }, // 'small' | 'medium' | 'large'
  },
  data: {
    stars: [1, 2, 3, 4, 5],
  },
  methods: {
    onStarTap(e) {
      if (this.properties.readonly) return;
      const score = e.currentTarget.dataset.score;
      this.triggerEvent('change', { score });
    },
  },
});
