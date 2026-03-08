import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StockpileItem } from '../types';
import * as XLSX from 'xlsx';

export async function exportToJSON(items: StockpileItem[]) {
  const fileName = `Stockpile_Full_Backup_${new Date().toISOString().split('T')[0]}_veilsoar.json`;
  const jsonContent = JSON.stringify(items, null, 2);
  const base64Data = btoa(unescape(encodeURIComponent(jsonContent)));

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

export async function importFromJSON(file: File): Promise<StockpileItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          // Try decoding base64 if JSON.parse fails
          const decoded = decodeURIComponent(escape(atob(text)));
          parsed = JSON.parse(decoded);
        }

        if (!Array.isArray(parsed)) {
          reject(new Error('Invalid JSON format: Expected an array of items.'));
          return;
        }

        resolve(parsed as StockpileItem[]);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
