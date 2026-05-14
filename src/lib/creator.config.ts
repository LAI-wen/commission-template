const config = {
  // 基本資料
  name: "小花插畫",
  nameEn: "Shoka Illustration",
  bio: "喜歡畫溫柔系女孩，接受原創和二創委託。",
  avatar: "/avatar.jpg",          // 放在 static/ 資料夾

  // 風格標籤（同步到聚合平台用）
  styles: ["厚塗", "水彩風", "溫柔系"],
  tags: ["原創", "二創", "女性向"],

  // 聯絡方式
  contact: {
    email: "shoka@example.com",
    discord: "shoka#1234",
    twitter: "https://twitter.com/shoka",
  },

  // 聚合平台 token（部署後填入）
  hubToken: "",
  hubUrl: "https://commission-hub.pages.dev",
} as const

export default config
