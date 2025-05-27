export default {
  path: "/system",
  name: "System",
  component: () => import("@/layout/index.vue"),
  redirect: "/system/user-monitor",
  meta: {
    icon: "Setting",
    title: "系统管理",
    rank: 10
  },
  children: [
    {
      path: "/system/user-monitor",
      name: "UserMonitor",
      component: () => import("@/components/UserStatusMonitor/index.vue"),
      meta: {
        title: "用户状态监控"
      }
    }
  ]
};
