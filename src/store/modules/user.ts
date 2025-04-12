import { defineStore } from "pinia";
import {
  type userType,
  store,
  router,
  resetRouter,
  routerArrays,
  storageLocal
} from "../utils";
import { useMultiTagsStoreHook } from "./multiTags";
import { removeToken, userKey } from "@/utils/auth";
import type { DictionaryData, TokenDTO } from "@/api/common/login";

const dictionaryListKey = "slurry-dictionary-list";
const dictionaryMapKey = "slurry-dictionary-map";

export const useUserStore = defineStore({
  id: "slurry-user",
  state: (): userType => ({
    // 头像
    avatar:
      storageLocal().getItem<TokenDTO>(userKey)?.currentUser.userInfo.avatar ??
      "",
    // 用户名
    username:
      storageLocal().getItem<TokenDTO>(userKey)?.currentUser.userInfo
        .username ?? "",
    // 昵称
    // nickname: storageLocal().getItem<TokenDTO>(userKey)?.nickname ?? "",
    // 页面级别权限
    roles: storageLocal().getItem<TokenDTO>(userKey)?.currentUser.roleKey
      ? [storageLocal().getItem<TokenDTO>(userKey)?.currentUser.roleKey]
      : [],
    // 按钮级别权限
    permissions:
      storageLocal().getItem<TokenDTO>(userKey)?.currentUser.permissions ?? [],
    dictionaryList:
      storageLocal().getItem<Map<String, Array<DictionaryData>>>(
        dictionaryListKey
      ) ?? new Map(),
    // @ts-ignore
    dictionaryMap:
      storageLocal().getItem<Map<String, Map<String, DictionaryData>>>(
        dictionaryMapKey
      ) ?? new Map(),
    currentUserInfo:
      storageLocal().getItem<TokenDTO>(userKey)?.currentUser.userInfo ?? {},
    // 是否勾选了登录页的免登录
    isRemembered: false,
    // 登录页的免登录存储几天，默认7天
    loginDay: 7
  }),
  actions: {
    /** 存储头像 */
    SET_AVATAR(avatar: string) {
      this.avatar = avatar;
    },
    /** 存储用户名 */
    SET_USERNAME(username: string) {
      this.username = username;
    },
    /** 存储昵称 */
    SET_NICKNAME(nickname: string) {
      this.nickname = nickname;
    },
    /** 存储角色 */
    SET_ROLES(roles: Array<string>) {
      this.roles = roles;
    },
    /** 存储按钮级别权限 */
    SET_PERMS(permissions: Array<string>) {
      this.permissions = permissions;
    },
    /** 存储是否勾选了登录页的免登录 */
    SET_ISREMEMBERED(bool: boolean) {
      this.isRemembered = bool;
    },
    /** 设置登录页的免登录存储几天 */
    SET_LOGINDAY(value: number) {
      this.loginDay = Number(value);
    },
    /** 存储系统内的字典值 并拆分为Map形式和List形式 */
    SET_DICTIONARY(dictionary: Map<String, Array<DictionaryData>>) {
      /** 由于localStorage不能存储Map对象,所以用Obj来装载数据 */
      const dictionaryMapTmp = {};

      for (const obj in dictionary) {
        dictionaryMapTmp[obj] = dictionary[obj].reduce((map, dict) => {
          map[dict.value] = dict;
          return map;
        }, {});
      }

      /** 将字典分成List形式和Map形式 List便于下拉框展示 Map便于匹配值 */
      this.dictionaryList = dictionary;
      this.dictionaryMap = dictionaryMapTmp;

      storageLocal().setItem<Map<String, Array<DictionaryData>>>(
        dictionaryListKey,
        dictionary
      );

      storageLocal().setItem<Map<String, Map<String, DictionaryData>>>(
        dictionaryMapKey,
        dictionaryMapTmp as Map<String, Map<String, DictionaryData>>
      );
    },
    /** 前端登出（不调用接口） */
    logOut() {
      this.username = "";
      this.roles = [];
      this.permissions = [];
      removeToken();
      useMultiTagsStoreHook().handleTags("equal", [...routerArrays]);
      resetRouter();
      router.push("/login");
    }
    /** 刷新`token` */
    // async handRefreshToken(data) {
    //   return new Promise<RefreshTokenResult>((resolve, reject) => {
    //     refreshTokenApi(data)
    //       .then(data => {
    //         if (data) {
    //           setToken(data.data);
    //           resolve(data);
    //         }
    //       })
    //       .catch(error => {
    //         reject(error);
    //       });
    //   });
    // }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
