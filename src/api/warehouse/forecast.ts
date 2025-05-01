import { http } from "@/utils/http";

// export * from "./forecast/index";

export const addForecastApi = (data: any) => {
  console.log("data", data);
  return http.request("post", "/forecast/add", { data });
};

export const importForecastApi = (data: any) => {
  return http.request("post", "/forecast/import", { data });
};

export const getForecastListApi = (data: any) => {
  return http.request("get", "/forecast/list", { params: data });
};

export const deleteForecastApi = (id: number | string) => {
  return http.request("delete", `/forecast/delete/${id}`, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const batchDeleteForecastApi = (ids: (number | string)[]) => {
  return http.request("delete", "/forecast/batch/delete", {
    data: { ids },
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const batchStorageApi = (data: {
  items: Array<{
    goods_url: string;
    tracking_no: string;
    product_code?: string; // UPC/IMEI，可选
  }>;
}) => {
  return http.request("post", "/forecast/batch-storage", {
    data,
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const updateForecastApi = (data: {
  id: string | number;
  product_name: string;
  warehouse_id: string | number;
}) => {
  return http.request<{
    code: number;
    message: string;
  }>("put", `/warehouse/forecast/${data.id}`, { data });
};

// 批量添加到爬取队列
export const batchAddToCrawlerQueueApi = (ids: (number | string)[]) => {
  return http.request<any>(
    "post",
    "/warehouse/forecast/batch-add-to-crawler-queue",
    {
      data: { forecast_ids: ids },
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
};

/**
 * 检查订单号是否已存在
 *
 * @param data
 * @returns
 */
export const checkOrderNoExistsApi = (data: { orderNos: string[] }) => {
  return http.request("post", "/forecast/check-order-no-exists", {
    data,
    headers: {
      "Content-Type": "application/json"
    }
  });
};
