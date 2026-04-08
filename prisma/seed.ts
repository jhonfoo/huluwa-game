import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcryptjs from "bcryptjs";
import path from "path";

const dbPath = path.join(__dirname, "..", "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 只清空非用户数据，保留管理员手动创建的卖家账号
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.payLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.news.deleteMany();
  await prisma.banner.deleteMany();
  const adminPassword = await bcryptjs.hash("cc121212", 12);

  // upsert 管理员（不影响卖家账号）
  await prisma.user.upsert({
    where: { phone: "admin" },
    update: { password: adminPassword, nickname: "管理员" },
    create: { phone: "admin", password: adminPassword, nickname: "管理员", role: "admin", balance: 0 },
  });

  // 创建特约卖家账号（用于挂载预设商品）
  const specialSeller = await prisma.user.upsert({
    where: { phone: "special_seller" },
    update: { nickname: "特约卖家" },
    create: { phone: "special_seller", password: adminPassword, nickname: "特约卖家", role: "admin", balance: 0 },
  });

  // 创建分类
  const catDefault = await prisma.category.create({ data: { name: "热卖品", icon: "🔥", sort: 1 } });
  const catGold = await prisma.category.create({ data: { name: "金币中心", icon: "🪙", sort: 2 } });
  const catMobile = await prisma.category.create({ data: { name: "手机游戏", icon: "📱", sort: 3 } });
  const catPC = await prisma.category.create({ data: { name: "网络游戏", icon: "🖥️", sort: 4 } });
  const catRecycle = await prisma.category.create({ data: { name: "官方回收", icon: "♻️", sort: 5 } });

  // 创建10个 preset=true 的预设商品
  const presetProducts = [
    { title: "100亿金币", price: 100, images: "/products/product1.png" },
    { title: "魔兽世界怀旧服10000金", price: 50, images: "/products/product2.png" },
    { title: "最终幻想14六千九百万金币", price: 300, images: "/products/product3.png" },
    { title: "奇迹世界150亿金币", price: 500, images: "/products/product4.png" },
    { title: "流放之路200个神圣石", price: 20, images: "/products/product5.jpg" },
    { title: "龙之谷2000000金币", price: 110, images: "/products/product6.png" },
    { title: "270亿两游戏币", price: 100, images: "/products/product7.png" },
    { title: "3000张神石", price: 220, images: "/products/product8.png" },
    { title: "天龙八部4200张元宝票", price: 100, images: "/products/product9.png" },
    { title: "EVE经典服500亿ISK", price: 300, images: "/products/product10.png" },
  ];

  for (const p of presetProducts) {
    const sales = Math.floor(Math.random() * 201) + 300;
    const views = Math.floor(Math.random() * 4001) + 4000;
    await prisma.product.create({
      data: {
        title: p.title,
        price: p.price,
        images: p.images,
        categoryId: catDefault.id,
        sellerId: specialSeller.id,
        status: "approved",
        preset: true,
        stock: 9999,
        description: p.title,
        sales,
        views,
      },
    });
  }

  // 轮播图
  await prisma.banner.createMany({
    data: [
      { image: "/banners/banner1.jpg", link: "/products?categoryId=gold", sort: 1 },
      { image: "/banners/banner2.jpg", link: "/products?categoryId=mobile", sort: 2 },
      { image: "/banners/banner3.jpg", link: "/products?categoryId=pc", sort: 3 },
    ],
  });

  // 资讯
  await prisma.news.createMany({
    data: [
      { title: "葫芦娃游戏交易平台正式上线！安全交易从这里开始", content: "欢迎来到葫芦娃游戏交易平台，我们致力于为广大玩家提供安全、便捷的游戏虚拟物品交易服务。", views: 1024 },
      { title: "平台交易安全指南：如何保护您的账号安全", content: "在进行游戏交易时，请注意以下几点：1. 不要在平台外进行交易；2. 不要泄露个人账号密码。", views: 856 },
    ],
  });

  console.log("Seed data created successfully!");
  console.log("Admin: admin / cc121212");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
