import { defineStore } from "pinia";
import { ref } from "vue";

export const useCountriesStore = defineStore("countries", () => {
  // 字典列表
  const dictionaryList = ref({
    "common.status": [
      { label: "启用", value: "1" },
      { label: "禁用", value: "0" }
    ]
  });

  return {
    dictionaryList
  };
});

// 创建Hook以便在组件中使用
export function useCountriesStoreHook() {
  return useCountriesStore();
} 