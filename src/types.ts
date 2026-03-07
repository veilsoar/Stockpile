export interface StockpileItem {
  id: string;
  name: string;
  category: string;
  purchaseDate: number; // timestamp
  price: number;
  platform: string;
  notes: string;
  imageUri?: string; // base64 string
  expiryDate?: number; // timestamp
  tags?: string[];
}
