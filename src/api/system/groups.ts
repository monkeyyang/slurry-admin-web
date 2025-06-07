import { http } from "@/utils/http";

export interface Group {
  id: string;
  name: string;
  code: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GroupsResponse {
  code: number;
  message: string;
  data: {
    data: Group[];
    total: number;
  };
}

export interface GroupsQueryParams {
  pageSize?: number;
  pageNum?: number;
  status?: string;
}

export const getGroupsListApi = (params: GroupsQueryParams) => {
  return http.request<GroupsResponse>("get", "/trade/itunes/groups", {
    params
  });
};
