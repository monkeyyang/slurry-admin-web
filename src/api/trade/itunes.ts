import { http } from "@/utils/http";
import type { CountryTradeConfig } from "./types";

// 获取所有国家配置
export const getCountryConfigsApi = () => {
  return http.request<{
    code: number;
    message: string;
    data: CountryTradeConfig[];
  }>("get", "/trade/itunes/configs");
};

// 获取单个国家配置
export const getCountryConfigApi = (countryCode: string) => {
  return http.request<{
    code: number;
    message: string;
    data: CountryTradeConfig;
  }>("get", `/trade/itunes/configs/${countryCode}`);
};

// 保存国家配置
export const saveCountryConfigApi = (config: CountryTradeConfig) => {
  return http.request<{
    code: number;
    message: string;
    data: CountryTradeConfig;
  }>("post", "/trade/itunes/configs", { data: config });
};

// 更新国家配置
export const updateCountryConfigApi = (
  id: string,
  config: CountryTradeConfig
) => {
  return http.request<{
    code: number;
    message: string;
    data: CountryTradeConfig;
  }>("put", `/trade/itunes/configs/${id}`, { data: config });
};

// 删除国家配置
export const deleteCountryConfigApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: null;
  }>("delete", `/trade/itunes/configs/${id}`);
};

// 获取所有模板
export const getTemplatesApi = () => {
  return http.request<{
    code: number;
    message: string;
    data: any[];
  }>("get", "/trade/itunes/templates");
};

// 保存模板
export const saveTemplateApi = (
  name: string,
  configs: CountryTradeConfig[]
) => {
  return http.request<{
    code: number;
    message: string;
    data: any;
  }>("post", "/trade/itunes/templates", {
    data: {
      name,
      data: configs
    }
  });
};

// 应用模板
export const applyTemplateApi = (id: string) => {
  return http.request<{
    code: number;
    message: string;
    data: CountryTradeConfig[];
  }>("post", `/trade/itunes/templates/${id}/apply`);
};
