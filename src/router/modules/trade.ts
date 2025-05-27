import { RouteRecordRaw } from "vue-router";

const tradeRoutes: RouteRecordRaw = {
  path: "/trade",
  name: "Trade",
  redirect: "/trade/gift-exchange",
  meta: {
    title: "交易管理",
    icon: "ep:money"
  },
  children: [
    {
      path: "/trade/gift-exchange",
      name: "GiftExchange",
      component: () => import("@/views/trade/gift-exchange/index.vue"),
      meta: {
        title: "礼品卡兑换",
        icon: "ep:present"
      }
    },
    {
      path: "/trade/gift-excharge",
      name: "GiftExcharge", 
      component: () => import("@/views/trade/gift-excharge/index.vue"),
      meta: {
        title: "礼品卡充值",
        icon: "ep:credit-card"
      }
    },
    {
      path: "/trade/plans",
      name: "TradePlans",
      component: () => import("@/views/trade/plans/index.vue"),
      meta: {
        title: "兑换计划",
        icon: "ep:list"
      }
    },
    {
      path: "/trade/groups",
      name: "TradeGroups",
      component: () => import("@/views/trade/gift-exchange/groups/index.vue"),
      meta: {
        title: "账号组管理",
        icon: "ep:user-filled"
      }
    },
    {
      path: "/trade/itunes-card",
      name: "ItunesCard",
      component: () => import("@/views/trade/itunes-card/index.vue"),
      meta: {
        title: "iTunes卡管理",
        icon: "ep:postcard"
      }
    }
  ]
};

export default tradeRoutes; 