import { http } from "@/utils/http";

export interface InviteCodeQuery {
  code?: string;
  status?: string;
  createdBy?: string;
  usedBy?: string;
  startTime?: string;
  endTime?: string;
}

export interface InviteCodeData {
  id: number;
  code: string;
  status: string; // 'unused' | 'used' | 'expired'
  createdBy: string;
  createdTime: string;
  usedBy: string;
  usedTime: string;
  expireTime: string;
  remark: string;
}

// 获取邀请码列表
export const getInviteCodeListApi = (params?: InviteCodeQuery) => {
  return http.request<{
    total: number;
    list: InviteCodeData[];
  }>("get", "/system/invite-code/list", { params });
};

// 获取邀请码详情
export const getInviteCodeDetailApi = (id: number | string) => {
  return http.request<InviteCodeData>("get", `/system/invite-code/${id}`);
};

// 新增邀请码
export const addInviteCodeApi = (data: Partial<InviteCodeData>) => {
  return http.request("post", "/system/invite-code", { data });
};

// 批量生成邀请码
export const batchGenerateInviteCodeApi = (data: {
  count: number;
  expireTime?: string;
  remark?: string;
}) => {
  return http.request("post", "/system/invite-code/batch", { data });
};

// 更新邀请码
export const updateInviteCodeApi = (
  id: number | string,
  data: Partial<InviteCodeData>
) => {
  return http.request("put", `/system/invite-code/${id}`, { data });
};

// 删除邀请码
export const deleteInviteCodeApi = (id: number | string) => {
  return http.request("delete", `/system/invite-code/${id}`);
};

// 禁用邀请码
export const disableInviteCodeApi = (id: number | string) => {
  return http.request("put", `/system/invite-code/${id}/disable`);
};
