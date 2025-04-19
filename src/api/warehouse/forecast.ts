import { http } from "@/utils/http";

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
