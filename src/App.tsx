import React, { useState, useEffect, useRef, useMemo } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { StockpileItem } from './types';
import { getAllItems, saveItem, deleteItems, saveItems } from './store';
import { exportToJSON, exportToExcel, importFromJSON } from './utils/export';
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
  const [defaultCategory, setDefaultCategory] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [customBg, setCustomBg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateBg = () => {
      setCustomBg(localStorage.getItem('app_custom_bg'));
    };
    updateBg();
    window.addEventListener('storage', updateBg);
    return () => window.removeEventListener('storage', updateBg);
  }, []);

  useEffect(() => {
    loadItems();

    // Capacitor Hardware Back Button Listener
    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (currentView === 'form') {
        setCurrentView('list');
      } else if (selectedCategory) {
        setSelectedCategory(null);
      } else if (!canGoBack) {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [currentView, selectedCategory]);

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

  const handleAdd = (category?: string) => {
    setDefaultCategory(category);
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

  const handleExport = async (type: 'json' | 'excel') => {
    if (items.length === 0) {
      alert('没有可以导出的数据');
      return;
    }
    if (type === 'json') {
      await exportToJSON(items);
    } else {
      await exportToExcel(items);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm('确定要将导入的备份数据与当前记录合并吗？(This will merge data with current records)')) {
      return;
    }

    try {
      setIsLoading(true);
      const importedItems = await importFromJSON(file);
      if (Array.isArray(importedItems)) {
        // Merge logic: Combine current items with imported items
        const mergedItems = [...items, ...importedItems];
        // Remove duplicates based on ID if necessary (assuming items have unique IDs)
        const uniqueItems = Array.from(new Map(mergedItems.map(item => [item.id, item])).values());
        
        await saveItems(uniqueItems);
        await loadItems();
        alert(`成功合并 ${importedItems.length} 条数据！(共 ${uniqueItems.length} 条)`);
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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-full max-w-md mx-auto shadow-2xl overflow-hidden relative font-sans flex flex-col"
      style={customBg ? {
        backgroundImage: `url(${customBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {!customBg && <div className="absolute inset-0 bg-stone-50 -z-10" />}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />
      
      <div className="flex-1 overflow-hidden relative bg-transparent">
        <AnimatePresence>
          {currentView === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              className="absolute inset-0 z-20 bg-transparent flex flex-col"
            >
              <ItemForm
                initialItem={editingItem}
                defaultCategory={defaultCategory}
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
              className="absolute inset-0 z-10 bg-transparent flex flex-col"
            >
              <ItemList
                items={items}
                onAdd={(cat) => handleAdd(cat)}
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
              className="absolute inset-0 z-10 bg-transparent flex flex-col"
            >
              <ItemList
                items={filteredCategoryItems}
                onAdd={(cat) => handleAdd(cat)}
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
              className="absolute inset-0 z-10 bg-transparent flex flex-col"
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
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md border border-white/50 shadow-lg rounded-full px-6 py-3 flex gap-8 items-center z-50">
          <button 
            onClick={() => setTab('overview')} 
            className={`transition-colors ${tab === 'overview' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-stone-600'}`}
          >
            <LayoutDashboard size={28} strokeWidth={tab === 'overview' ? 2.5 : 2} />
          </button>
          <button 
            onClick={() => setTab('categories')} 
            className={`transition-colors ${tab === 'categories' ? 'text-[var(--color-primary)]' : 'text-gray-400 hover:text-stone-600'}`}
          >
            <Layers size={28} strokeWidth={tab === 'categories' ? 2.5 : 2} />
          </button>
        </nav>
      )}
    </div>
  );
}
