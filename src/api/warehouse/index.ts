import { http } from "@/utils/http";
import { getCountryColorStyle } from "@/utils/countryColors";

// 仓库DTO接口
export interface WarehouseDTO {
  id: number;
  name: string;
  status: string | number;
  remark: string | null;
  create_time: string;
  update_time: string;
  deleted: number;
  address?: string; // 新增：仓库地址
  contact?: string; // 新增：联系人
  phone?: string; // 新增：联系电话
  goods?: {
    warehouse_id: number;
    goods_id: number;
    goods_name: string;
  }[];
  country?: string;
  country_name_zh?: string;
}

// 仓库分页数据接口
export interface WarehousePageData {
  current_page: number;
  data: WarehouseDTO[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// 仓库查询参数接口
export interface WarehouseQuery {
  name?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

// 仓库API函数

/**
 * 获取仓库列表
 * @param params 查询参数
 */
export function getWarehouseListApi(params?: WarehouseQuery) {
  return http.request("get", "/admin/warehouse/list", { params });
}

/**
 * 获取所有仓库（不分页）
 */
export function getAllWarehousesApi() {
  return http.request("get", "/admin/warehouse/all");
}

/**
 * 获取仓库信息
 * @param id 仓库ID
 */
export function getWarehouseInfoApi(id: number) {
  return http.request("get", `/admin/warehouse/info/${id}`);
}

/**
 * 添加仓库
 * @param data 仓库数据
 */
export function addWarehouseApi(
  data: Partial<WarehouseDTO> & { goods_ids?: number[] }
) {
  return http.request("post", "/admin/warehouse/create", { data });
}

/**
 * 更新仓库
 * @param id 仓库ID
 * @param data 仓库数据
 */
export function updateWarehouseApi(
  id: number,
  data: Partial<WarehouseDTO> & { goods_ids?: number[] }
) {
  return http.request("post", `/admin/warehouse/update/${id}`, { data });
}

/**
 * 更新仓库状态
 * @param data 包含id和status的对象
 */
export function updateWarehouseStatusApi(data: { id: number; status: string }) {
  return http.request("post", "/admin/warehouse/updateStatus", { data });
}

/**
 * 删除仓库
 * @param id 仓库ID
 */
export function deleteWarehouseApi(id: number) {
  return http.request("post", `/admin/warehouse/delete/${id}`);
}

/**
 * 获取仓库关联的货品
 * @param id 仓库ID
 */
export function getWarehouseGoodsApi(id: number) {
  return http.request("get", `/admin/warehouse/goods/${id}`);
}

/**
 * 获取货物列表
 * @param params 查询参数
 */
export function getWarehouseItemsApi(params: { warehouse_id: number }) {
  return http.request<WarehousePageData>("get", "/admin/warehouse/items", {
    params
  });
}

/**
 * 获取格式化的仓库列表选项
 */
export async function getWarehouseOptionsWithCountry(params = {}) {
  try {
    // Define response type
    type ApiResponse = {
      code: number;
      data: {
        data: WarehouseDTO[];
      };
    };

    const res = (await getWarehouseListApi(params)) as ApiResponse;

    if (res.code === 0 && res.data?.data && Array.isArray(res.data.data)) {
      return res.data.data.map(item => {
        // 获取国家显示名称
        const countryInfo = getCountryDisplayName(item);
        const countryStyle = getCountryColorStyle(item.country);

        return {
          value: item.id,
          label: countryInfo ? `${item.name} (${countryInfo})` : item.name,
          country: item.country,
          countryName: countryInfo,
          countryStyle,
          address: item.address,
          raw: item // 保留原始数据
        };
      });
    }
    console.warn("获取仓库列表数据格式异常:", res);
    return [];
  } catch (error) {
    console.error("获取仓库列表失败", error);
    return [];
  }
}

/**
 * 获取国家显示名称
 */
function getCountryDisplayName(warehouse) {
  if (warehouse.country_name_zh && warehouse.country) {
    return `${warehouse.country_name_zh}(${warehouse.country})`;
  } else if (warehouse.country_name_zh) {
    return warehouse.country_name_zh;
  } else if (warehouse.country) {
    return warehouse.country;
  }
  return "";
}

/**
 * 获取格式化的仓库列表选项，带有样式
 */
export async function getWarehouseOptionsWithStyle(params = {}) {
  try {
    const options = await getWarehouseOptionsWithCountry(params);
    return options.map(option => ({
      ...option,
      style: getCountryStyle(option.country)
    }));
  } catch (error) {
    console.error("获取带样式的仓库列表失败", error);
    return [];
  }
}

// 国家/地区代码颜色映射
const regionColors = {
  US: { color: "#409EFF", bg: "#ecf5ff" }, // 美国 - 蓝色
  CA: { color: "#67C23A", bg: "#f0f9eb" }, // 加拿大 - 绿色
  UK: { color: "#E6A23C", bg: "#fdf6ec" }, // 英国 - 橙色
  CN: { color: "#F56C6C", bg: "#fef0f0" }, // 中国 - 红色
  JP: { color: "#909399", bg: "#f4f4f5" }, // 日本 - 灰色
  DE: { color: "#9B59B6", bg: "#f5f0fa" }, // 德国 - 紫色
  FR: { color: "#3498DB", bg: "#edf7ff" }, // 法国 - 天蓝色
  AU: { color: "#16A085", bg: "#e6f7f3" } // 澳大利亚 - 青绿色
};

/**
 * 获取国家颜色样式
 */
function getCountryStyle(code) {
  if (!code) return { color: "#909399", bg: "#f4f4f5" }; // 默认灰色
  const countryCode = String(code).toUpperCase();
  return regionColors[countryCode] || { color: "#909399", bg: "#f4f4f5" };
}
