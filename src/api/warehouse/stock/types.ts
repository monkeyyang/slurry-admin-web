// 分页结果类型
export interface PageResult<T> {
  code: number;
  data: {
    list: T[];
    total: number;
  };
  msg: string;
}

// 库存相关接口的类型定义
export interface StockItem {
  id: string;
  forecast_id: string;
  goodsName: string;
  trackingNo: string;
  upcOrImei?: string;
  warehouseId: string;
  warehouseName?: string;
  matched?: boolean;
  status: "pending" | "stored" | "settled";
  createTime: string;
}

export interface ImportExcelParams {
  warehouseId: string;
  file: File;
}

export interface BatchStockInParams {
  warehouseId: string;
  items: {
    goodsName: string;
    trackingNo: string;
    upcOrImei?: string;
  }[];
}

export interface CustomerOrderDetail {
  id: number;
  preorder_no: string;
  customer_id: number;
  customer_name: string;
  warehouse_id: number;
  warehouse_name: string;
  product_name: string;
  goods_url: string;
  order_number: string;
  tracking_no: string;
  product_code: string | null;
  quantity: number;
  status: number;
  status_text: string;
  create_time: string;
  receive_time: string;
}
