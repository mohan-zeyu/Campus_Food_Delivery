// cloudfunctions/ai/index.js
const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

// Claude API key stored in environment variable
// Set via WeChat Cloud Function environment variable: CLAUDE_API_KEY
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  switch (event.type) {
    case 'search':              return aiSearch(event, OPENID);
    case 'suggestRemarks':      return suggestRemarks(event, OPENID);
    case 'generateReviewDraft': return generateReviewDraft(event, OPENID);
    default: return { success: false, errMsg: 'Unknown type' };
  }
};

async function _callClaude(systemPrompt, userMessage) {
  if (!CLAUDE_API_KEY) {
    return { success: false, errMsg: 'AI功能未配置，请联系管理员' };
  }
  const response = await cloud.callContainer({
    // 通过云函数直接调用外部 API
  });
  // Use wx-server-sdk's got or https
  const https = require('https');
  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.content[0].text);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function aiSearch(event, openid) {
  const { query } = event;
  if (!query) return { success: false, errMsg: '请输入搜索内容' };

  const systemPrompt = `你是校园食递平台的AI搜索助手。用户会用自然语言描述想要的食物，你需要将其解析为结构化的搜索条件。
返回JSON格式：{"keyword": "关键词", "category": "分类(主食/饮品/小吃/套餐/甜点/其他，可选)", "tags": ["标签1"], "maxPrice": 最高价格(分，可选), "summary": "一句话描述理解"}
只返回JSON，不要其他内容。`;

  try {
    const aiResult = await _callClaude(systemPrompt, query);
    const filters = JSON.parse(aiResult);

    // 用解析出的条件搜索商品
    let q = db.collection('products').where({ is_available: true });
    if (filters.keyword) {
      q = q.where({ name: db.RegExp({ regexp: filters.keyword, options: 'i' }) });
    }
    if (filters.category) q = q.where({ category: filters.category });
    if (filters.maxPrice) q = q.where({ price: db.command.lte(filters.maxPrice) });

    const res = await q.limit(20).get();
    return { success: true, data: res.data, filters, aiSummary: filters.summary };
  } catch (e) {
    return { success: false, errMsg: 'AI解析失败: ' + e.message };
  }
}

async function suggestRemarks(event, openid) {
  // 获取用户最近5条订单的备注
  const orders = await db.collection('order_items')
    .where({ _openid: openid })
    .orderBy('_id', 'desc')
    .limit(5).get();
  const history = orders.data.map(i => i.remarks).filter(Boolean);

  const systemPrompt = `你是一个校园食递平台的AI助手，帮助用户快速填写点餐备注。根据用户历史备注习惯，生成3条个性化备注建议。
历史备注：${JSON.stringify(history)}
返回JSON数组，每条不超过20字：["建议1","建议2","建议3"]
只返回JSON数组。`;

  try {
    const result = await _callClaude(systemPrompt, '请给我3条备注建议');
    const suggestions = JSON.parse(result);
    return { success: true, data: suggestions };
  } catch (e) {
    // 降级返回默认建议
    return { success: true, data: ['少辣', '不要葱', '打包好一点'] };
  }
}

async function generateReviewDraft(event, openid) {
  const { orderInfo, score } = event;
  const systemPrompt = `你是校园食递平台的AI评价助手。根据订单信息和评分，生成一段真实自然的评价文字。
要求：80-150字，口语化，符合中国大学生风格，不夸张。
评分${score}星（1-5），商家：${orderInfo.merchantName}，商品：${orderInfo.items}`;

  try {
    const draft = await _callClaude(systemPrompt, '帮我写一段评价');
    return { success: true, data: draft };
  } catch (e) {
    return { success: false, errMsg: 'AI生成失败' };
  }
}
