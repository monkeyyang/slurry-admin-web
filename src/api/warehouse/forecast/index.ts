// 修改预报
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
