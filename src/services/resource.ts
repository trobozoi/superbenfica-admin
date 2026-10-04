import type { ListParams, Paginated } from "@/types/api";
import { http } from "./http/client";

/** Remove filtros vazios para não enviar "?search=&loja=" à API. */
export function cleanParams(params: ListParams = {}): ListParams {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export interface ResourceService<T, TInput> {
  readonly name: string;
  list(params?: ListParams): Promise<Paginated<T>>;
  get(id: number): Promise<T>;
  create(input: TInput): Promise<T>;
  update(id: number, input: Partial<TInput>): Promise<T>;
  remove(id: number): Promise<void>;
}

/** CRUD padrão de um ViewSet do DRF. `name` também é a raiz das query keys. */
export function createResource<T, TInput>(endpoint: string): ResourceService<T, TInput> {
  return {
    name: endpoint,
    list: async (params) =>
      (await http.get<Paginated<T>>(endpoint, { params: cleanParams(params) })).data,
    get: async (id) => (await http.get<T>(`${endpoint}/${id}`)).data,
    create: async (input) => (await http.post<T>(endpoint, input)).data,
    update: async (id, input) => (await http.patch<T>(`${endpoint}/${id}`, input)).data,
    remove: async (id) => {
      await http.delete(`${endpoint}/${id}`);
    },
  };
}
