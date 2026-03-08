import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StockpileItem } from '../types';
import * as XLSX from 'xlsx';

export async function exportToJSON(items: StockpileItem[]) {
  const fileName = `Stockpile_Full_Backup_${new Date().toISOString().split('T')[0]}_veilsoar.json`;
  const jsonContent = JSON.stringify(items, null, 2);

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: jsonContent,
      directory: Directory.Cache,
    });

    const uri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: '完整备份',
      text: '这是您的全量囤货数据备份文件。',
      url: uri.uri,
      dialogTitle: '分享或保存备份',
    });
  } catch (error) {
    console.error('JSON Export failed:', error);
    alert('备份导出失败，请重试');
  }
}

export async function exportToExcel(items: StockpileItem[]) {
  const fileName = `Stockpile_List_${new Date().toISOString().split('T')[0]}_veilsoar.xlsx`;
  
  // Remove imageUri for Excel export to keep file size small
  const excelData = items.map(({ imageUri, ...item }) => item);
  
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stockpile');
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const base64Data = btoa(new Uint8Array(excelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));

  try {
    await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    const uri = await Filesystem.getUri({
      path: fileName,
      directory: Directory.Cache,
    });

    await Share.share({
      title: '导出 Excel',
      text: '这是您的囤货列表 Excel 文件。',
      url: uri.uri,
      dialogTitle: '分享或保存文件',
    });
  } catch (error) {
    console.error('Excel Export failed:', error);
    alert('Excel 导出失败，请重试');
  }
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
