import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StockpileItem } from './types';
import { getAllItems, saveItem, deleteItems, saveItems } from './store';
import { exportToCSV, importFromCSV } from './utils/export';
import ItemList from './components/ItemList';
import ItemForm from './components/ItemForm';
import CategoryList from './components/CategoryList';
import { LayoutDashboard, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [items, setItems] = useState<StockpileItem[]>([]);
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [tab, setTab] = useState<'overview' | 'categories'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<StockpileItem | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const loadedItems = await getAllItems();
      // Sort by purchaseDate descending
      loadedItems.sort((a, b) => b.purchaseDate - a.purchaseDate);
      setItems(loadedItems);
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategoryItems = useMemo(() => {
    if (!selectedCategory) return [];
    return items.filter(i => (i.category || '未分类') === selectedCategory);
  }, [items, selectedCategory]);

  const handleAdd = () => {
    setEditingItem(undefined);
    setCurrentView('form');
  };

  const handleEdit = (item: StockpileItem) => {
    setEditingItem(item);
    setCurrentView('form');
  };

  const handleSave = async (item: StockpileItem) => {
    try {
      await saveItem(item);
      await loadItems();
      setCurrentView('list');
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('保存失败，请重试');
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await deleteItems(ids);
      await loadItems();
    } catch (error) {
      console.error('Failed to delete items:', error);
      alert('删除失败，请重试');
    }
  };

  const handleExport = () => {
    if (items.length === 0) {
      alert('没有可以导出的数据');
      return;
    }
    exportToCSV(items);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const importedItems = await importFromCSV(file);
      if (importedItems.length > 0) {
        await saveItems(importedItems);
        await loadItems();
        alert(`成功导入 ${importedItems.length} 条数据！`);
      } else {
        alert('未能从文件中读取到有效数据。');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('导入失败，请检查文件格式。');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-stone-100 shadow-2xl overflow-hidden relative font-sans flex flex-col">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence>
          {currentView === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="absolute inset-0 z-20 bg-stone-100 flex flex-col"
            >
              <ItemForm
                initialItem={editingItem}
                onSave={handleSave}
                onCancel={() => setCurrentView('list')}
              />
            </motion.div>
          ) : tab === 'overview' && !selectedCategory ? (
            <motion.div 
              key="overview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 bg-stone-100 flex flex-col"
            >
              <ItemList
                items={items}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExport={handleExport}
                onImport={handleImportClick}
                showDashboard={true}
                hasBottomNav={true}
              />
            </motion.div>
          ) : selectedCategory ? (
            <motion.div 
              key="category-detail"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 bg-stone-100 flex flex-col"
            >
              <ItemList
                items={filteredCategoryItems}
                onAdd={handleAdd}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onExport={handleExport}
                onImport={handleImportClick}
                showDashboard={false}
                title={selectedCategory}
                onBack={() => setSelectedCategory(null)}
                hasBottomNav={false}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 bg-stone-100 flex flex-col"
            >
              <CategoryList
                items={items}
                onSelectCategory={setSelectedCategory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      {currentView === 'list' && !selectedCategory && (
        <nav className="bg-white/90 backdrop-blur-md border-t border-stone-200/50 px-6 py-2 pb-safe flex justify-around items-center z-30 relative">
          <button 
            onClick={() => setTab('overview')} 
            className={`flex flex-col items-center p-2 min-w-[64px] ${tab === 'overview' ? 'text-emerald-700' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <div className={`px-5 py-1 rounded-full transition-colors ${tab === 'overview' ? 'bg-emerald-100' : ''}`}>
              <LayoutDashboard size={24} strokeWidth={tab === 'overview' ? 2.5 : 2} />
            </div>
            <span className="text-[11px] font-medium mt-1">概览</span>
          </button>
          <button 
            onClick={() => setTab('categories')} 
            className={`flex flex-col items-center p-2 min-w-[64px] ${tab === 'categories' ? 'text-emerald-700' : 'text-stone-500 hover:text-stone-700'}`}
          >
            <div className={`px-5 py-1 rounded-full transition-colors ${tab === 'categories' ? 'bg-emerald-100' : ''}`}>
              <Layers size={24} strokeWidth={tab === 'categories' ? 2.5 : 2} />
            </div>
            <span className="text-[11px] font-medium mt-1">分类</span>
          </button>
        </nav>
      )}
    </div>
  );
}
