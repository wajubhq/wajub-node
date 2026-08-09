import type { ListMeta } from "../types.js";
import type { BaseClient } from "../http.js";
import { pickList } from "../http-utils.js";

export interface PagedResult<T> {
  data: T[];
  meta?: ListMeta;
  has_more: boolean;
  getNextPage(): Promise<PagedResult<T>>;
  [Symbol.asyncIterator](): AsyncIterator<T>;
}

class PagedResultImpl<T> implements PagedResult<T> {
  constructor(
    public data: T[],
    public meta: ListMeta | undefined,
    public has_more: boolean,
    private fetchPage: (page: number) => Promise<PagedResult<T>>,
  ) {}

  async getNextPage(): Promise<PagedResult<T>> {
    if (!this.has_more) throw new Error("No more pages available");
    const next = (this.meta?.current_page ?? 1) + 1;
    return this.fetchPage(next);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    for (const item of this.data) yield item;
    let page: PagedResult<T> = this;
    while (page.has_more) {
      page = await page.getNextPage();
      for (const item of page.data) yield item;
    }
  }
}

export function createPagedList<T>(
  client: BaseClient,
  path: string,
  pluralKey: string,
  params?: Record<string, unknown>,
): Promise<PagedResult<T>> {
  const fetchPage = async (pageNum: number): Promise<PagedResult<T>> => {
    const res = await client.get(path, { ...params, page: pageNum });
    const { data, meta } = pickList<T>(res, pluralKey);
    const m = meta as ListMeta | undefined;
    const has_more =
      m?.current_page != null && m?.last_page != null ? m.current_page < m.last_page : false;
    return new PagedResultImpl(data, m, has_more, fetchPage);
  };
  return fetchPage(Number(params?.page ?? 1));
}
