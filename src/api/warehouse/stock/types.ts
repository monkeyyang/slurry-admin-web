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
  id: string;
  customerName: string;
  goodsName: string;
  trackingNo: string;
  warehouseId: string;
  warehouseName: string;
  createTime: string;
  // 其他客户预报相关字段...
}
