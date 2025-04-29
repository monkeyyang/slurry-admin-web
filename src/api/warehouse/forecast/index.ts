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

// 批量添加到爬取队列
export const batchAddToCrawlerQueueApi = (ids: (number | string)[]) => {
  return http.request<{
    code: number;
    message: string;
  }>("post", "/warehouse/forecast/batch-add-to-crawler-queue", {
    data: { ids },
    headers: {
      "Content-Type": "application/json"
    }
  });
};
