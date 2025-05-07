import { http } from "@/utils/http";

// 国家DTO接口
export interface CountryDTO {
  name_zh: string;
  name_en: string;
  code: string;
  code2: string;
  status: string;
}

// 适配标准API响应格式
export interface ResponseData<T> {
  code: number;
  message: string;
  data: T;
}

// 链接对象
export interface PageLink {
  url: string | null;
  label: string;
  active: boolean;
}

// 国家分页数据接口
export interface CountryPageData {
  current_page: number;
  data: CountryDTO[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: PageLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// 国家查询接口
export interface CountryQuery extends BasePageQuery {
  name_zh?: string;
  name_en?: string;
  code?: string;
  code2?: string;
  status?: string;
  pageSize?: number;
}

// 获取国家列表
export const getCountriesListApi = (params?: CountryQuery) => {
  return http.request<ResponseData<CountryPageData>>(
    "get",
    "/system/countries/list",
    {
      params
    }
  );
};

// 启用国家
export const enableCountryApi = (id: number) => {
  return http.request<ResponseData<null>>(
    "post",
    `/system/countries/enable/${id}`
  );
};

// 禁用国家
export const disableCountryApi = (id: number) => {
  return http.request<ResponseData<null>>(
    "post",
    `/system/countries/disable/${id}`
  );
};

// 添加国家
export const addCountryApi = (data: CountryDTO) => {
  return http.request<ResponseData<null>>("post", "/system/countries", {
    data
  });
};

// 更新国家
export const updateCountryApi = (id: number | string, data: CountryDTO) => {
  return http.request<ResponseData<null>>("put", `/system/countries/${id}`, {
    data
  });
};
