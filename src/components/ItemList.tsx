import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StockpileItem } from '../types';
import { Search, Plus, Download, Upload, Trash2, Edit3, Image as ImageIcon, TrendingDown, AlertCircle, ArrowLeft, Settings, ArrowUpDown, Layers, Info, Sparkles, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ItemCard, { calculateDailyCost } from './ItemCard';
import { customStringCompare } from '../utils/sort';

interface ItemListProps {
  items: StockpileItem[];
  onAdd: () => void;
  onEdit: (item: StockpileItem) => void;
  onDelete: (ids: string[]) => void;
  onExport: () => void;
  onImport: () => void;
  showDashboard?: boolean;
  title?: string;
  onBack?: () => void;
  hasBottomNav?: boolean;
}

const THEME_COLORS = [
  { name: 'Blue', value: '#007AFF' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f97316' },
];

export default function ItemList({ 
  items, 
  onAdd, 
  onEdit, 
  onDelete, 
  onExport, 
  onImport,
  showDashboard = true,
  title = 'Stockpile',
  onBack,
  hasBottomNav = false
}: ItemListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'category' | 'tag'>('time');
  const [showNearExpiry, setShowNearExpiry] = useState(false);

  useEffect(() => {
    const savedColor = localStorage.getItem('themeColor');
    if (savedColor) {
      document.documentElement.style.setProperty('--color-primary', savedColor);
    }
  }, []);

  const handleColorChange = (color: string) => {
    document.documentElement.style.setProperty('--color-primary', color);
    localStorage.setItem('themeColor', color);
  };

  const settingsRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    
    // Filter by search query
    const query = debouncedQuery.toLowerCase();
    if (query) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.category || '未分类').toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query)) ||
          (item.platform || '').toLowerCase().includes(query) ||
          (item.notes || '').toLowerCase().includes(query)
      );
    }

    // Filter by near expiry
    if (showNearExpiry) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      result = result.filter(item => {
        if (!item.expiryDate) return false;
        const daysUntil = Math.ceil((item.expiryDate - todayStart) / (1000 * 60 * 60 * 24));
        return daysUntil <= 30;
      });
    }

    return result;
  }, [items, debouncedQuery, showNearExpiry]);

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems];
    sorted.sort((a, b) => {
      if (sortBy === 'time') {
        return b.purchaseDate - a.purchaseDate;
      } else if (sortBy === 'category') {
        const catA = a.category || '未分类';
        const catB = b.category || '未分类';
        const catCompare = customStringCompare(catA, catB);
        if (catCompare !== 0) return catCompare;
        return b.purchaseDate - a.purchaseDate;
      } else if (sortBy === 'tag') {
        const tagA = a.tags?.[0] || '无标签';
        const tagB = b.tags?.[0] || '无标签';
        const tagCompare = customStringCompare(tagA, tagB);
        if (tagCompare !== 0) return tagCompare;
        return b.purchaseDate - a.purchaseDate;
      }
      return 0;
    });
    return sorted;
  }, [filteredItems, sortBy]);

  // Calculate total daily average cost
  const totalDailyCost = useMemo(() => {
    return items.reduce((total, item) => total + calculateDailyCost(item.price, item.purchaseDate), 0);
  }, [items]);

  // Calculate expiring items
  const expiringItemsCount = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return items.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntil = Math.ceil((item.expiryDate - todayStart) / (1000 * 60 * 60 * 24));
      return daysUntil <= 30; // Expiring in 30 days or already expired
    }).length;
  }, [items]);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      if (newSelected.size === 0) setIsSelectionMode(false);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleLongPress = (id: string) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedIds(new Set([id]));
    }
  };

  const handleDeleteSelected = () => {
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个物品吗？`)) {
      onDelete(Array.from(selectedIds));
      setIsSelectionMode(false);
      setSelectedIds(new Set());
    }
  };

  const cancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchQuery(tag);
  };

  return (
    <div className="flex flex-col h-full bg-stone-100 relative pt-safe">
      {/* Top App Bar */}
      <header className="bg-stone-100/80 backdrop-blur-md text-stone-900 px-4 py-4 sticky top-0 z-20 border-b border-stone-200/50 h-16 flex items-center pt-[env(safe-area-inset-top,20px)]">
        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button onClick={cancelSelection} className="p-2 -ml-2 rounded-full hover:bg-stone-200">
                <span className="text-xl">✕</span>
              </button>
              <h1 className="text-lg font-medium">已选择 {selectedIds.size} 项</h1>
            </div>
            <button onClick={handleDeleteSelected} className="p-2 rounded-full text-red-600 hover:bg-red-50">
              <Trash2 size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              {onBack && (
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-200 transition-colors">
                  <ArrowLeft size={20} />
                </button>
              )}
              <div className="flex flex-col">
                <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
                {onBack && <span className="text-[11px] text-stone-500 font-medium mt-0.5">共 {items.length} 件</span>}
              </div>
            </div>
            {!onBack && (
              <div className="flex items-center gap-1">
                {/* Sort Toggle (Funnel Icon) */}
                <div className="relative" ref={sortRef}>
                  <button 
                    onClick={() => setShowSort(!showSort)} 
                    className="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
                  >
                    <Filter size={20} />
                  </button>
                  
                  <AnimatePresence>
                    {showSort && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-30"
                      >
                        <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">排序</div>
                        <button 
                          onClick={() => { setSortBy('time'); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors ${sortBy === 'time' ? 'bg-primary/10 text-primary font-medium' : 'text-stone-700 hover:bg-stone-50'}`}
                        >
                          按时间排序
                        </button>
                        <button 
                          onClick={() => { setSortBy('category'); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors border-t border-stone-100 ${sortBy === 'category' ? 'bg-primary/10 text-primary font-medium' : 'text-stone-700 hover:bg-stone-50'}`}
                        >
                          按分类排序
                        </button>
                        <button 
                          onClick={() => { setSortBy('tag'); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors border-t border-stone-100 ${sortBy === 'tag' ? 'bg-primary/10 text-primary font-medium' : 'text-stone-700 hover:bg-stone-50'}`}
                        >
                          按标签排序
                        </button>
                        <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider border-t border-stone-100">筛选</div>
                        <button 
                          onClick={() => { setShowNearExpiry(!showNearExpiry); setShowSort(false); }}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors border-t border-stone-100 ${showNearExpiry ? 'bg-primary/10 text-primary font-medium' : 'text-stone-700 hover:bg-stone-50'}`}
                        >
                          {showNearExpiry ? '✓ 仅显示临期/过期' : '仅显示临期/过期'}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Settings */}
                <div className="relative" ref={settingsRef}>
                  <button 
                    onClick={() => setShowSettings(!showSettings)} 
                    className="p-2 rounded-full hover:bg-stone-200 text-stone-600 transition-colors"
                  >
                    <Settings size={20} />
                  </button>
                  
                  {/* Settings Dropdown */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-stone-100 overflow-hidden z-30"
                      >
                        <div className="px-4 py-2 text-xs font-semibold text-stone-400 uppercase tracking-wider">主题颜色</div>
                        <div className="flex gap-2 px-4 py-2">
                          {THEME_COLORS.map(color => (
                            <button
                              key={color.name}
                              onClick={() => handleColorChange(color.value)}
                              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: color.value }}
                            />
                          ))}
                        </div>
                        <button 
                          onClick={() => { setShowInfoDialog(true); setShowSettings(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                        >
                          <Info size={18} className="text-stone-400" />
                          说明
                        </button>
                        <button 
                          onClick={() => { onImport(); setShowSettings(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                        >
                          <Upload size={18} className="text-stone-400" />
                          导入 Excel/CSV
                        </button>
                        <button 
                          onClick={() => { onExport(); setShowSettings(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                        >
                          <Download size={18} className="text-stone-400" />
                          导出 Excel/CSV
                        </button>
                        <button 
                          onClick={() => { setShowAboutDialog(true); setShowSettings(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-100"
                        >
                          <Sparkles size={18} className="text-stone-400" />
                          关于
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        )}
      </header>
      
      {/* Search Bar */}
      {!isSelectionMode && (
        <div className="px-4 pt-3">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search size={18} className="text-stone-400" />
            </div>
            <input
              type="text"
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/70 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 focus:ring-2 focus:ring-primary transition-all text-sm text-stone-800"
            />
          </div>
        </div>
      )}

      <main className={`flex-1 overflow-y-auto px-4 pt-2 space-y-4 ${hasBottomNav ? 'pb-32' : 'pb-24'}`}>
        {/* Dashboard Header Card (Slimmed Down) */}
        {!isSelectionMode && showDashboard && items.length > 0 && (
          <div className="bg-primary/10 rounded-2xl p-4 shadow-sm border border-primary/20 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Daily Cost */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 text-primary mb-1">
                  <TrendingDown size={14} />
                  <h2 className="text-xs font-medium tracking-wide uppercase">总计日均消耗</h2>
                </div>
                <div className="flex items-baseline gap-1 text-primary">
                  <span className="text-base font-semibold">¥</span>
                  <span className="text-2xl font-bold tracking-tight">{totalDailyCost.toFixed(2)}</span>
                  <span className="text-primary/80 font-medium text-[10px] ml-1">/ 天</span>
                </div>
              </div>

              {/* Right: Expiring Warning */}
              {expiringItemsCount > 0 && (
                <div className="flex-1 flex flex-col items-end text-right border-l border-primary/20 pl-4">
                  <div className="flex items-center gap-1 text-red-600 mb-1">
                    <AlertCircle size={12} />
                    <span className="text-xs font-medium">临期提醒</span>
                  </div>
                  <div className="flex items-baseline gap-1 text-red-700">
                    <span className="text-xl font-bold">{expiringItemsCount}</span>
                    <span className="text-xs">件</span>
                  </div>
                  <span className="text-[10px] text-red-600/80 mt-0.5">即将或已过期</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Item List (Horizontal Layout) */}
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-6 pt-12">
            <div className="w-40 h-40 bg-primary/5 rounded-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse opacity-50"></div>
              <ImageIcon size={48} className="text-primary relative z-10" />
              <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-sm">
                <Plus size={20} className="text-primary" />
              </div>
            </div>
            <div className="text-center space-y-2 max-w-[240px]">
              <p className="text-lg font-semibold text-stone-800">还没有囤货记录？</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                点击右下角按钮，开启你的第一笔资产记录吧！
              </p>
            </div>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-stone-400 space-y-3">
            <Search size={32} className="text-stone-300" />
            <p className="text-sm font-medium">没有找到匹配的物品</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            <AnimatePresence>
              {sortedItems.map((item, index) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  isSelected={selectedIds.has(item.id)}
                  isSelectionMode={isSelectionMode}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelection(item.id);
                    } else {
                      onEdit(item);
                    }
                  }}
                  onLongPress={() => handleLongPress(item.id)}
                  onTagClick={handleTagClick}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      {!isSelectionMode && (
        <button
          onClick={onAdd}
          className={`absolute right-5 w-14 h-14 text-white rounded-2xl shadow-[0_8px_20px_rgba(0,122,255,0.4)] hover:shadow-[0_12px_24px_rgba(0,122,255,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center z-30 border border-white/20 ${hasBottomNav ? 'bottom-24' : 'bottom-6'}`}
          style={{ background: 'var(--color-primary)' }}
        >
          <Plus size={28} />
        </button>
      )}

      {/* Info Dialog */}
      <AnimatePresence>
        {showInfoDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/50"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Info size={24} />
                </div>
                <h3 className="text-lg font-bold text-stone-800">说明</h3>
              </div>
              
              <div className="space-y-5 text-sm text-stone-600">
                <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100/50">
                  <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                    <Search size={16} className="text-primary" />
                    搜索支持
                  </h4>
                  <p className="leading-relaxed">支持对物品的 <span className="font-medium text-stone-800">名称、购买平台、标签 (Tags) </span> 和 <span className="font-medium text-stone-800">备注</span> 进行多维度模糊搜索。</p>
                </div>
                
                <div className="bg-stone-50/50 p-4 rounded-2xl border border-stone-100/50">
                  <h4 className="font-semibold text-stone-800 mb-2 flex items-center gap-2">
                    <ArrowUpDown size={16} className="text-primary" />
                    排序逻辑
                  </h4>
                  <p className="leading-relaxed">App 的自动排序优先级为：<br/><span className="font-medium text-stone-800">汉字（按拼音 A-Z） &gt; 数字 &gt; 字母</span>。</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowInfoDialog(false)}
                className="mt-6 w-full py-3 bg-stone-100 text-stone-800 rounded-xl font-medium hover:bg-stone-200 transition-colors active:scale-[0.98]"
              >
                我知道了
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* About Dialog */}
      <AnimatePresence>
        {showAboutDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-white/50 flex flex-col"
            >
              <div className="flex flex-col items-center mb-6">
                <h2 className="text-3xl font-bold tracking-tight text-stone-800 mb-2 font-sans">Stockpile</h2>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium tracking-wider">v1.1</span>
              </div>
              
              <div className="space-y-4 text-sm text-stone-600 leading-relaxed overflow-y-auto max-h-[60vh] px-1">
                <p>
                  这是一个为了拯救“买时爽歪歪，找时抓脑袋”而诞生的 App。代码是由 Gemini 熬夜写的，Bug 是由veilsoar亲手调教的。
                </p>
                
                <div className="space-y-3 mt-4">
                  <h4 className="font-bold text-stone-800">核心技能：</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">✨</span>
                      <span><strong className="text-stone-800">视觉玄学：</strong> 搭载了高级感拉满的高斯模糊，让你的囤货清单看起来像在云端。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">🏮</span>
                      <span><strong className="text-stone-800">中文尊严：</strong> 坚持汉字排在数字和字母前面，因为我坚信“汉字才是最稳的”。</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">🚀</span>
                      <span><strong className="text-stone-800">丝滑飞行：</strong> 本功能为了功耗考虑，已下线。</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-100/50 mt-4">
                  <h4 className="font-bold text-stone-800 mb-1">温馨提示：</h4>
                  <p className="text-xs text-stone-500">
                    1.1 版正式出道，虽然它现在还没法帮你自动补货，但它已经学会了帮你盯着钱包的每一个子儿。如果它偶尔闹小脾气（崩溃），请重启并给它一个爱的抱抱。
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setShowAboutDialog(false)}
                className="mt-6 w-full py-3 bg-stone-100 text-stone-800 rounded-xl font-medium hover:bg-stone-200 transition-colors active:scale-[0.98]"
              >
                关闭
              </button>

              <div className="mt-6 text-center">
                <p className="text-[10px] text-stone-400 font-medium tracking-wider uppercase">
                  Made with ❤️ by veilsoar
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
