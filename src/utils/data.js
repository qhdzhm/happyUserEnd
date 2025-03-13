// destinations img
import tour4 from "../assets/images/tour/Tokyo.png";
import tour5 from "../assets/images/tour/bali-1.png";
import tour6 from "../assets/images/tour/bangkok.png";
import tour7 from "../assets/images/tour/cancun.png";
import tour8 from "../assets/images/tour/nah-trang.png";
import tour9 from "../assets/images/tour/phuket.png";
import tour10 from "../assets/images/tour/paris.png";
import tour11 from "../assets/images/tour/malaysia.png";

// populars img
import Anchorage from "../assets/images/popular/Anchorage To La Paz.jpg";
import Singapore from "../assets/images/popular/Discover Singapore.png";
import Kiwiana from "../assets/images/popular/Kiwiana Panorama.jpg";
import Quito from "../assets/images/popular/Anchorage To Quito.jpg";
import Cuzco from "../assets/images/popular/Cuzco To Anchorage.jpg";
import Ushuaia from "../assets/images/popular/Anchorage To Ushuaia.jpg";
import Santiago from "../assets/images/popular/Anchorage To Santiago.jpg";
import Explorer from "../assets/images/popular/LA Explorer.jpg";

// tour detail img
import image1 from "../assets/images/new/1.jpg";
import image2 from "../assets/images/new/2.jpg";
import image3 from "../assets/images/new/3.jpg";
import image4 from "../assets/images/new/4.jpg";
import image5 from "../assets/images/new/5.jpg";
import image6 from "../assets/images/new/6.jpg";
import image7 from "../assets/images/new/7.jpg";
import image8 from "../assets/images/new/8.jpg";

// 筛选选项数据
export const location = [
  "塔斯马尼亚北部",
  "塔斯马尼亚南部",
  "塔斯马尼亚东部",
  "塔斯马尼亚西部",
  "塔斯马尼亚中部",
  "塔斯马尼亚东南部",
  "霍巴特"
];

export const Categories = [
  "自然风光",
  "海滩",
  "城市观光",
  "岛屿",
  "历史文化",
  "购物美食",
  "美食体验"
];

export const TourTypes = [
  "跟团游",
  "一日游"
];

// 一日游筛选选项
export const DayTourThemes = [
  "自然风光",
  "城市观光",
  "历史文化",
  "美食体验",
  "摄影之旅",
  "户外活动"
];

export const DayTourDuration = [
  "2-4小时",
  "4-6小时",
  "6-8小时",
  "8小时以上"
];

// 跟团游筛选选项
export const GroupTourThemes = [
  "休闲度假",
  "探险体验",
  "文化探索",
  "美食之旅",
  "亲子游",
  "蜜月旅行"
];

export const GroupTourDuration = [
  "2-3天",
  "4-5天",
  "6-7天",
  "7天以上"
];

export const PriceRange = [
  "0-500",
  "500-1000",
  "1000-2000",
  "2000-3000",
  "3000以上"
];

export const Ratings = [3, 3.5, 4, 4.5, 5];

// 添加适合人群数据
export const SuitableFor = [
  "家庭",
  "情侣",
  "朋友",
  "独自旅行",
  "老年人",
  "儿童"
];

// 塔斯马尼亚景点数据 - 一日游
export const tasmaniaAttractions = [
  {
    id: 1,
    name: "摇篮山国家公园一日游",
    location: "塔斯马尼亚北部",
    description: "世界遗产，拥有壮观的山脉和原始森林，是徒步爱好者的天堂。",
    type: "自然风光",
    tourType: ["一日游"],
    rating: 4.9,
    price: 120,
    duration: "8小时",
    image: tour5,
    category: "自然风光",
    themes: ["自然风光", "户外活动", "摄影之旅"],
    suitableFor: ["家庭", "情侣", "朋友", "独自旅行"]
  },
  {
    id: 2,
    name: "酒杯湾海滩一日游",
    location: "塔斯马尼亚东部",
    description: "拥有世界上最美丽的海滩之一，湛蓝的海水和洁白的沙滩形成鲜明对比。",
    type: "海滩",
    tourType: ["一日游"],
    rating: 4.8,
    price: 100,
    duration: "6小时",
    image: tour4,
    category: "海滩",
    themes: ["自然风光", "户外活动", "摄影之旅"],
    suitableFor: ["家庭", "情侣", "朋友"]
  },
  {
    id: 3,
    name: "霍巴特市区观光一日游",
    location: "霍巴特",
    description: "塔斯马尼亚首府，拥有丰富的历史建筑和萨拉曼卡市场。",
    type: "城市观光",
    tourType: ["一日游"],
    rating: 4.6,
    price: 80,
    duration: "5小时",
    image: tour6,
    category: "城市观光",
    themes: ["城市观光", "历史文化", "美食体验"],
    suitableFor: ["家庭", "老年人", "朋友"]
  },
  {
    id: 4,
    name: "布鲁尼岛一日游",
    location: "塔斯马尼亚东南部",
    description: "岛上有丰富的野生动物和美丽的海岸线，是观赏企鹅的好地方。",
    type: "岛屿",
    tourType: ["一日游"],
    rating: 4.7,
    price: 150,
    duration: "9小时",
    image: tour7,
    category: "岛屿",
    themes: ["自然风光", "户外活动", "摄影之旅"],
    suitableFor: ["家庭", "儿童", "情侣"]
  },
  {
    id: 5,
    name: "菲欣纳国家公园一日游",
    location: "塔斯马尼亚东部",
    description: "拥有壮观的粉红色花岗岩山脉和清澈的海湾，是徒步和摄影的绝佳地点。",
    type: "自然风光",
    tourType: ["一日游"],
    rating: 4.8,
    price: 110,
    duration: "7小时",
    image: tour8,
    category: "自然风光",
    themes: ["自然风光", "摄影之旅", "户外活动"],
    suitableFor: ["情侣", "朋友", "独自旅行"]
  },
  {
    id: 6,
    name: "塔斯曼半岛历史一日游",
    location: "塔斯马尼亚东南部",
    description: "以其戏剧性的海岸线和历史遗迹而闻名，包括亚瑟港历史遗址。",
    type: "历史文化",
    tourType: ["一日游"],
    rating: 4.7,
    price: 130,
    duration: "8小时",
    image: tour9,
    category: "历史文化",
    themes: ["历史文化", "城市观光"],
    suitableFor: ["家庭", "老年人", "朋友"]
  },
  {
    id: 7,
    name: "威灵顿山徒步一日游",
    location: "霍巴特",
    description: "霍巴特的标志性山脉，可俯瞰整个城市和德文特河。",
    type: "自然风光",
    tourType: ["一日游"],
    rating: 4.5,
    price: 90,
    duration: "6小时",
    image: tour10,
    category: "自然风光",
    themes: ["自然风光", "摄影之旅", "户外活动"],
    suitableFor: ["家庭", "情侣", "朋友", "老年人"]
  },
  {
    id: 8,
    name: "萨拉曼卡市场美食一日游",
    location: "霍巴特",
    description: "澳大利亚最好的户外市场之一，提供当地美食、手工艺品和新鲜农产品。",
    type: "购物美食",
    tourType: ["一日游"],
    rating: 4.6,
    price: 60,
    duration: "4小时",
    image: tour11,
    category: "购物美食",
    themes: ["美食体验", "城市观光"],
    suitableFor: ["家庭", "情侣", "朋友", "老年人"]
  },
  {
    id: 10,
    name: "罗素瀑布徒步一日游",
    location: "塔斯马尼亚中部",
    description: "位于山谷中的壮观瀑布，周围环绕着茂密的雨林。",
    type: "自然风光",
    tourType: ["一日游"],
    rating: 4.5,
    price: 85,
    duration: "5小时",
    image: tour4,
    category: "自然风光",
    themes: ["自然风光", "户外活动"],
    suitableFor: ["家庭", "情侣", "朋友"]
  }
];

export const destinationsData = [
  {
    id: 0,
    name: "摇篮山精华探索",
    tours: "8小时精选行程",
    image: tour5,
    link: "tour-name",
    shortDes: "探索塔斯马尼亚最著名的自然景观",
  },
  {
    id: 1,
    name: "酒杯湾风光之旅",
    tours: "6小时精选行程",
    image: tour4,
    link: "tour-name",
    shortDes: "欣赏世界级海滩和壮观海岸线",
  },

  {
    id: 2,
    name: "霍巴特城市漫游",
    tours: "5小时精选行程",
    image: tour6,
    link: "tour-name",
    shortDes: "探索塔斯马尼亚首府的历史与文化",
  },

  {
    id: 3,
    name: "布鲁尼岛生态探秘",
    tours: "9小时精选行程",
    image: tour7,
    link: "tour-name",
    shortDes: "体验岛屿生活和野生动物观赏",
  },
  {
    id: 4,
    name: "菲欣纳森林探险",
    tours: "7小时精选行程",
    image: tour8,
    link: "tour-name",
    shortDes: "徒步探索原始森林和瀑布",
  },
  {
    id: 5,
    name: "塔斯曼半岛奇观",
    tours: "8小时精选行程",
    image: tour9,
    link: "tour-name",
    shortDes: "参观历史遗迹和自然奇观",
  },
  {
    id: 6,
    name: "威灵顿山巅峰体验",
    tours: "6小时精选行程",
    image: tour10,
    link: "tour-name",
    shortDes: "登山欣赏霍巴特全景",
  },
  {
    id: 7,
    name: "萨拉曼卡美食之旅",
    tours: "4小时精选行程",
    image: tour11,
    link: "tour-name",
    shortDes: "品尝当地美食和手工艺品",
  },
];

export const popularsData = [
  {
    id: 0,
    title: "塔斯马尼亚精华5日游",
    image: Singapore,
    location: "霍巴特出发，环岛游览",
    category: ["精品团队", "自然风光"],
    days: "5天4晚",
    price: 1200,
    afterDiscount: 1080,
    rating: 4.8,
    reviews: 56,
    themes: ["休闲度假", "文化探索"],
    suitableFor: ["家庭", "情侣", "朋友"],
    tourType: ["跟团游"],
    duration: "5天4晚"
  },
  {
    id: 1,
    title: "塔斯马尼亚西海岸探险3日游",
    image: Kiwiana,
    location: "斯特拉恩出发，西海岸探索",
    category: ["精品团队", "探险"],
    days: "3天2晚",
    price: 880,
    afterDiscount: 790,
    rating: 4.6,
    reviews: 42,
    themes: ["探险体验", "休闲度假"],
    suitableFor: ["朋友", "情侣"],
    tourType: ["跟团游"],
    duration: "3天2晚"
  },
  {
    id: 2,
    title: "塔斯马尼亚东海岸休闲4日游",
    image: Quito,
    location: "霍巴特出发，东海岸线路",
    category: ["精品团队", "海滩度假"],
    days: "4天3晚",
    price: 950,
    afterDiscount: 899,
    rating: 4.5,
    reviews: 38,
    themes: ["休闲度假", "文化探索"],
    suitableFor: ["家庭", "情侣", "老年人"],
    tourType: ["跟团游"],
    duration: "4天3晚"
  },
  {
    id: 3,
    title: "塔斯马尼亚美食与葡萄酒之旅",
    image: Anchorage,
    location: "霍巴特出发，环岛美食探索",
    category: ["精品团队", "美食体验"],
    days: "6天5晚",
    price: 1500,
    afterDiscount: 1350,
    rating: 4.9,
    reviews: 64,
    themes: ["美食之旅", "文化探索"],
    suitableFor: ["情侣", "朋友"],
    tourType: ["跟团游"],
    duration: "6天5晚"
  },
  {
    id: 4,
    title: "塔斯马尼亚野生动物观赏团",
    image: Cuzco,
    location: "霍巴特出发，多地野生动物保护区",
    category: ["精品团队", "野生动物"],
    days: "4天3晚",
    price: 980,
    afterDiscount: 930,
    rating: 4.7,
    reviews: 51,
    themes: ["探险体验", "亲子游"],
    suitableFor: ["家庭", "儿童"],
    tourType: ["跟团游"],
    duration: "4天3晚"
  },
  {
    id: 5,
    title: "塔斯马尼亚历史文化探索之旅",
    image: Ushuaia,
    location: "霍巴特出发，历史遗迹探索",
    category: ["精品团队", "文化体验"],
    days: "5天4晚",
    price: 1100,
    afterDiscount: 990,
    rating: 4.4,
    reviews: 35,
    themes: ["文化探索", "休闲度假"],
    suitableFor: ["老年人", "朋友"],
    tourType: ["跟团游"],
    duration: "5天4晚"
  },
  {
    id: 6,
    title: "塔斯马尼亚徒步探险7日游",
    image: Santiago,
    location: "霍巴特出发，多地徒步路线",
    category: ["精品团队", "徒步"],
    days: "7天6晚",
    price: 1680,
    afterDiscount: 1580,
    rating: 4.8,
    reviews: 47,
    themes: ["探险体验", "休闲度假"],
    suitableFor: ["朋友", "独自旅行"],
    tourType: ["跟团游"],
    duration: "7天6晚"
  },
  {
    id: 7,
    title: "塔斯马尼亚家庭欢乐之旅",
    image: Explorer,
    location: "霍巴特出发，适合家庭的行程",
    category: ["精品团队", "家庭友好"],
    days: "5天4晚",
    price: 1300,
    afterDiscount: 1170,
    rating: 4.7,
    reviews: 53,
    themes: ["亲子游", "休闲度假"],
    suitableFor: ["家庭", "儿童"],
    tourType: ["跟团游"],
    duration: "5天4晚"
  },
  {
    id: 9,
    title: "塔斯马尼亚蜜月浪漫之旅",
    image: tour5,
    location: "霍巴特出发，环岛浪漫景点",
    category: ["精品团队", "浪漫之旅"],
    days: "6天5晚",
    price: 1800,
    afterDiscount: 1620,
    rating: 4.9,
    reviews: 38,
    themes: ["蜜月旅行", "休闲度假"],
    suitableFor: ["情侣"],
    tourType: ["跟团游"],
    duration: "6天5晚"
  }
];

export const tourDetails = {
  title: "Beautiful Bali with Malaysia",
  des: ` Bali, also known as the land of gods has plenty to offer to travelers from across the globe. As it so contrasted oh estimating instrument. Size like body some one had.  Are conduct viewing boy minutes warrant the expense?  Tolerably behavior may admit daughters offending her ask own. Praise effect wishes change way and any wanted.  Lively use looked latter regard had. Do he it part more  last in. We understand that theory is important to build a solid foundation, we understand that theory alone isn't going to get the job done so that's why this is packed with practical hands-on examples that you can  follow step by step.`,
  price: "280.00",
  rating: " 4.5",
  reviews: "365 reviews",
  tourInfo: [
    '<strong className="font-bold"> Place Covered</strong>: Bali - Ubud',
    ' <strong className="font-bold">Duration:</strong>5 Days, 4 Nights',
    '<strong className="font-bold">Start Point:</strong> Ngurah International Airport',
    '<strong className="font-bold">End Point:</strong>  Ngurah International Airport',
  ],

  highlights: [
    " Experience a delightful tropical getaway with a luxurious stay and witness the picture-perfect beaches, charming waterfalls and so much more",
    " Dependent on so extremely delivered by. Yet no jokes  worse her why. Bed one supposing breakfast day fulfilled off depending questions.",
    " Whatever boy her exertion his extended. Ecstatic  followed handsome drawings entirely Mrs one yet  outweigh.",
    "Meant balls it if up doubt small purse. Required his  you put the outlived answered position. A pleasure exertion if believed provided to.",
  ],

  itinerary: [
    {
      title: `<span class="me-1 fw-bold">Day 1:</span>  Airport Pick Up `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.`,
    },

    {
      title: `<span class="me-1 fw-bold">Day 2:</span>  Temples & River Cruise `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in. `,
    },
    {
      title: `<span class="me-1 fw-bold">Day 3:</span>  Massage & Overnight Train`,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.`,
    },
    {
      title: `<span class="me-1 fw-bold">Day 4:</span>  Khao Sok National Park `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.`,
    },
    {
      title: `<span class="me-1 fw-bold">Day 5:</span>  Travel to Koh Phangan `,
      des: ` Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.
      `,
    },
    {
      title: `<span class="me-1 fw-bold">Day 6:</span> Morning Chill & Muay Thai Lesson `,
      des: `Like on all of our trips, we can collect you from the airport when you land and take you directly to your hotel. The first Day is just a check-in Day so you have this freedom to explore the city and get settled in.
      `,
    },
  ],

  included: [
    "Comfortable stay for 4 nights in your preferred category Hotels",
    "Professional English speaking guide to help you explore the cities",
    "Breakfast is included as mentioned in Itinerary.",
    "Per Peron rate on twin sharing basis",
    "Entrance Tickets to Genting Indoor Theme Park    ",
    "All Tours & Transfers on Seat In Coach Basis ",
    "Visit Bali Safari & Marine Park with Jungle Hopper Pass    ",
  ],
  exclusion: [
    "Lunch and dinner are not included in CP plans",
    "Any other services not specifically mentioned in the inclusions",
    "Medical and Travel insurance",
    "Airfare is not included ",
    "Early Check-In & Late Check-Out ",
    "Anything which is not specified in Inclusions    ",
  ],

  images: [
    {
      original: image1,
      thumbnail: image1,
    },
    {
      original: image2,
      thumbnail: image2,
    },
    {
      original: image3,
      thumbnail: image3,
    },
    {
      original: image4,
      thumbnail: image4,
    },
    {
      original: image5,
      thumbnail: image5,
    },

    {
      original: image6,
      thumbnail: image6,
    },
    {
      original: image7,
      thumbnail: image7,
    },
    {
      original: image8,
      thumbnail: image8,
    },
  ],
};
