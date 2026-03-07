import { StockpileItem } from '../types';

export function exportToCSV(items: StockpileItem[]) {
  const headers = ['ID', '名称', '分类', '购买日期', '购买金额', '购买平台', '备注', '过期日期', '标签', '图片URI'];
  
  const rows = items.map(item => {
    return [
      `"${item.id}"`,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.purchaseDate,
      item.price,
      `"${(item.platform || '').replace(/"/g, '""')}"`,
      `"${(item.notes || '').replace(/"/g, '""')}"`,
      item.expiryDate || '',
      `"${(item.tags || []).join(';').replace(/"/g, '""')}"`,
      `"${(item.imageUri || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `stockpile_export_${new Date().getTime()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importFromCSV(file: File): Promise<StockpileItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const cleanText = text.replace(/^\uFEFF/, '');
        const parsed = parseCSV(cleanText);

        if (parsed.length < 2) {
          resolve([]);
          return;
        }

        const items: StockpileItem[] = [];

        for (let i = 1; i < parsed.length; i++) {
          const row = parsed[i];
          if (row.length < 5) continue; // Skip empty or malformed rows

          const item: StockpileItem = {
            id: row[0] || crypto.randomUUID(),
            name: row[1] || '未命名',
            category: row[2] || '',
            purchaseDate: parseInt(row[3]) || Date.now(),
            price: parseFloat(row[4]) || 0,
            platform: row[5] || '',
            notes: row[6] || '',
            expiryDate: row[7] ? parseInt(row[7]) : undefined,
            tags: row[8] ? row[8].split(';').filter(Boolean) : [],
            imageUri: row[9] || undefined
          };
          items.push(item);
        }
        resolve(items);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function parseCSV(str: string): string[][] {
  const arr: string[][] = [];
  let quote = false;
  let row = 0, col = 0;
  for (let c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c + 1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
}
