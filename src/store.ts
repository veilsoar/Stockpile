import { get, set } from 'idb-keyval';
import { StockpileItem } from './types';

const STORE_KEY = 'stockpile_items';

export async function getAllItems(): Promise<StockpileItem[]> {
  const items = await get<StockpileItem[]>(STORE_KEY);
  return items || [];
}

export async function saveItem(item: StockpileItem): Promise<void> {
  const items = await getAllItems();
  const existingIndex = items.findIndex((i) => i.id === item.id);
  if (existingIndex >= 0) {
    items[existingIndex] = item;
  } else {
    items.push(item);
  }
  await set(STORE_KEY, items);
}

export async function saveItems(newItems: StockpileItem[]): Promise<void> {
  const items = await getAllItems();
  const itemMap = new Map(items.map((i) => [i.id, i]));
  
  newItems.forEach((item) => {
    itemMap.set(item.id, item);
  });
  
  await set(STORE_KEY, Array.from(itemMap.values()));
}


export async function deleteItems(ids: string[]): Promise<void> {
  const items = await getAllItems();
  const newItems = items.filter((i) => !ids.includes(i.id));
  await set(STORE_KEY, newItems);
}
