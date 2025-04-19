import { http } from "@/utils/http";

export const addForecastApi = (data: any) => {
  console.log("data", data);
  return http.request("post", "/forecast/add", { data });
};

export const importForecastApi = (data: any) => {
  return http.post("/forecast/import", data);
};

export const getForecastListApi = (data: any) => {
  return http.request("get", "/forecast/list", { params: data });
};

export const deleteForecastApi = (data: any) => {
  return http.post("/forecast/delete", data);
};
