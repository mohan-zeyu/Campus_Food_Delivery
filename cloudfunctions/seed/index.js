// cloudfunctions/seed/index.js
// 一次性种子数据函数，用于初始化测试数据
// 在微信开发者工具云函数控制台调用: { "type": "seed" }
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  if (event.type === "seed") return seedAll();
  if (event.type === "clearAll") return clearAll();
  return { success: false, errMsg: "Unknown type" };
};

async function clearAll() {
  try {
    for (const col of ["merchants", "products", "notices"]) {
      const res = await db.collection(col).get();
      for (const doc of res.data) {
        await db.collection(col).doc(doc._id).remove();
      }
    }
    return { success: true, msg: "已清空" };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}

async function seedAll() {
  try {
    // ── 商家数据 ───────────────────────────────────────────
    const merchants = [
      {
        name: "饭香四溢·中式快餐",
        cover_image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600",
        location: "一食堂 2楼 东侧",
        campus_zone: "east",
        operating_hours: { open: "07:00", close: "21:00" },
        delivery_zones: ["east", "west", "north", "south"],
        delivery_fee_rules: [
          { zone: "east", fee: 100 },
          { zone: "west", fee: 200 },
          { zone: "north", fee: 300 },
          { zone: "south", fee: 200 },
        ],
        min_order: 1500,
        avg_rating: 4.8,
        rating_count: 256,
        status: "open",
        owner_openid: "",
        created_at: new Date(),
      },
      {
        name: "西式轻食·沙拉站",
        cover_image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600",
        location: "二食堂 1楼 西侧",
        campus_zone: "west",
        operating_hours: { open: "10:00", close: "20:00" },
        delivery_zones: ["east", "west", "north", "south"],
        delivery_fee_rules: [
          { zone: "east", fee: 200 },
          { zone: "west", fee: 100 },
          { zone: "north", fee: 200 },
          { zone: "south", fee: 300 },
        ],
        min_order: 2000,
        avg_rating: 4.6,
        rating_count: 132,
        status: "open",
        owner_openid: "",
        created_at: new Date(),
      },
      {
        name: "麻辣烫·胡辣汤",
        cover_image: "https://images.unsplash.com/photo-1555126634-323283e090fa?w=600",
        location: "学生街 3号",
        campus_zone: "north",
        operating_hours: { open: "11:00", close: "22:00" },
        delivery_zones: ["north", "east"],
        delivery_fee_rules: [
          { zone: "north", fee: 100 },
          { zone: "east", fee: 200 },
        ],
        min_order: 1000,
        avg_rating: 4.5,
        rating_count: 89,
        status: "open",
        owner_openid: "",
        created_at: new Date(),
      },
      {
        name: "奶茶屋·饮品专区",
        cover_image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
        location: "图书馆旁 便利店",
        campus_zone: "south",
        operating_hours: { open: "09:00", close: "23:00" },
        delivery_zones: ["south", "east", "west", "north"],
        delivery_fee_rules: [
          { zone: "south", fee: 100 },
          { zone: "east", fee: 200 },
          { zone: "west", fee: 200 },
          { zone: "north", fee: 300 },
        ],
        min_order: 1200,
        avg_rating: 4.9,
        rating_count: 512,
        status: "open",
        owner_openid: "",
        created_at: new Date(),
      },
      {
        name: "黄焖鸡·盖浇饭",
        cover_image: "https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600",
        location: "东区食堂 3楼",
        campus_zone: "east",
        operating_hours: { open: "10:30", close: "21:30" },
        delivery_zones: ["east", "north"],
        delivery_fee_rules: [
          { zone: "east", fee: 150 },
          { zone: "north", fee: 250 },
        ],
        min_order: 1500,
        avg_rating: 4.7,
        rating_count: 198,
        status: "open",
        owner_openid: "",
        created_at: new Date(),
      },
    ];

    const merchantIds = [];
    for (const m of merchants) {
      const res = await db.collection("merchants").add({ data: m });
      merchantIds.push(res._id);
    }

    // ── 商品数据 ───────────────────────────────────────────
    const productsData = [
      // 商家0: 中式快餐
      [
        { name: "红烧肉盖饭", category: "主食", price: 1800, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400"], inventory: -1, tags: ["招牌", "热销"], is_available: true },
        { name: "番茄鸡蛋炒饭", category: "主食", price: 1200, packaging_fee: 30, images: ["https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400"], inventory: -1, tags: ["经典"], is_available: true },
        { name: "宫保鸡丁饭", category: "主食", price: 1500, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400"], inventory: -1, tags: ["辣", "下饭"], is_available: true },
        { name: "麻婆豆腐饭", category: "主食", price: 1300, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400"], inventory: -1, tags: ["辣", "下饭"], is_available: true },
        { name: "紫菜蛋花汤", category: "饮品", price: 500, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=400"], inventory: -1, tags: ["热饮"], is_available: true },
        { name: "凉拌黄瓜", category: "小吃", price: 800, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400"], inventory: -1, tags: ["清爽"], is_available: true },
        { name: "套餐A（饭+汤+小菜）", category: "套餐", price: 2500, packaging_fee: 80, images: ["https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400"], inventory: -1, tags: ["超值", "推荐"], is_available: true },
      ],
      // 商家1: 西式轻食
      [
        { name: "鸡胸肉沙拉", category: "套餐", price: 2800, packaging_fee: 60, images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"], inventory: -1, tags: ["低热量", "健康"], is_available: true },
        { name: "牛油果三明治", category: "主食", price: 2200, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400"], inventory: -1, tags: ["健康", "素食"], is_available: true },
        { name: "蓝莓燕麦碗", category: "主食", price: 2500, packaging_fee: 60, images: ["https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=400"], inventory: -1, tags: ["健康", "早餐"], is_available: true },
        { name: "水果捞", category: "甜点", price: 1800, packaging_fee: 40, images: ["https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400"], inventory: -1, tags: ["甜品"], is_available: true },
        { name: "鲜榨橙汁", category: "饮品", price: 1500, packaging_fee: 30, images: ["https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400"], inventory: -1, tags: ["鲜榨"], is_available: true },
        { name: "轻食套餐（沙拉+饮品）", category: "套餐", price: 3800, packaging_fee: 80, images: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400"], inventory: -1, tags: ["超值", "健康"], is_available: true },
      ],
      // 商家2: 麻辣烫
      [
        { name: "麻辣烫（素菜）", category: "主食", price: 1500, packaging_fee: 30, images: ["https://images.unsplash.com/photo-1555126634-323283e090fa?w=400"], inventory: -1, tags: ["辣", "素食"], is_available: true },
        { name: "麻辣烫（肉菜）", category: "主食", price: 2200, packaging_fee: 30, images: ["https://images.unsplash.com/photo-1555126634-323283e090fa?w=400"], inventory: -1, tags: ["辣", "热销"], is_available: true },
        { name: "胡辣汤", category: "饮品", price: 800, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=400"], inventory: -1, tags: ["暖身", "辣"], is_available: true },
        { name: "烤冷面", category: "小吃", price: 1200, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400"], inventory: -1, tags: ["辣", "香"], is_available: true },
        { name: "炸串（5串）", category: "小吃", price: 1000, packaging_fee: 15, images: ["https://images.unsplash.com/photo-1535400255456-984b873e9b59?w=400"], inventory: -1, tags: ["炸物", "辣"], is_available: true },
      ],
      // 商家3: 奶茶
      [
        { name: "珍珠奶茶", category: "饮品", price: 1500, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], inventory: -1, tags: ["招牌", "热销"], is_available: true },
        { name: "芝士奶盖绿茶", category: "饮品", price: 1800, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], inventory: -1, tags: ["网红", "芝士"], is_available: true },
        { name: "草莓豆乳", category: "饮品", price: 1600, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400"], inventory: -1, tags: ["少糖", "推荐"], is_available: true },
        { name: "焦糖玛奇朵", category: "饮品", price: 2000, packaging_fee: 25, images: ["https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400"], inventory: -1, tags: ["咖啡"], is_available: true },
        { name: "古早味红茶", category: "饮品", price: 800, packaging_fee: 15, images: ["https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400"], inventory: -1, tags: ["平价"], is_available: true },
        { name: "芋泥波波", category: "甜点", price: 1700, packaging_fee: 25, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], inventory: -1, tags: ["芋泥", "热销"], is_available: true },
        { name: "双拼奶茶套餐", category: "套餐", price: 2800, packaging_fee: 35, images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"], inventory: -1, tags: ["超值", "推荐"], is_available: true },
      ],
      // 商家4: 黄焖鸡
      [
        { name: "黄焖鸡米饭（小份）", category: "主食", price: 1600, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400"], inventory: -1, tags: ["招牌", "热销"], is_available: true },
        { name: "黄焖鸡米饭（大份）", category: "主食", price: 2200, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400"], inventory: -1, tags: ["招牌"], is_available: true },
        { name: "牛腩盖浇饭", category: "主食", price: 2500, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400"], inventory: -1, tags: ["嫩滑"], is_available: true },
        { name: "香菇滑鸡饭", category: "主食", price: 1800, packaging_fee: 50, images: ["https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400"], inventory: -1, tags: ["嫩滑", "推荐"], is_available: true },
        { name: "老豆腐汤", category: "饮品", price: 600, packaging_fee: 20, images: ["https://images.unsplash.com/photo-1547592180-85f173990554?w=400"], inventory: -1, tags: ["暖胃"], is_available: true },
        { name: "饭+汤套餐", category: "套餐", price: 2000, packaging_fee: 60, images: ["https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=400"], inventory: -1, tags: ["超值"], is_available: true },
      ],
    ];

    let productCount = 0;
    for (let i = 0; i < merchantIds.length; i++) {
      for (const p of productsData[i]) {
        await db.collection("products").add({
          data: { ...p, merchant_id: merchantIds[i], created_at: new Date() },
        });
        productCount++;
      }
    }

    // ── 公告数据 ───────────────────────────────────────────
    const notices = [
      {
        title: "🎉 校园食递正式上线！",
        content: "欢迎使用校园食递，现已接入5家优质商家，更多商家陆续入驻中~",
        type: "announcement",
        is_active: true,
        created_by: "system",
        expires_at: null,
        created_at: new Date(),
      },
      {
        title: "🔥 新用户首单立减3元",
        content: "新用户注册即享首单立减3元优惠，快去下单吧！",
        type: "promotion",
        is_active: true,
        created_by: "system",
        expires_at: null,
        created_at: new Date(),
      },
      {
        title: "📢 配送时间公告",
        content: "每日配送时间：07:00-22:00，超时订单将于次日配送",
        type: "system",
        is_active: true,
        created_by: "system",
        expires_at: null,
        created_at: new Date(),
      },
    ];

    for (const n of notices) {
      await db.collection("notices").add({ data: n });
    }

    return {
      success: true,
      msg: `种子数据已写入: ${merchantIds.length}个商家, ${productCount}个商品, ${notices.length}条公告`,
      merchantIds,
    };
  } catch (e) {
    return { success: false, errMsg: e.message };
  }
}
