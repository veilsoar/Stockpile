import React, { useMemo } from 'react';
import { StockpileItem } from '../types';
import { 
  Layers, ChevronRight, PackageOpen, Monitor, Smartphone, 
  Sparkles, Pill, Coffee, ShoppingBag, Home, Book 
} from 'lucide-react';
import { customStringCompare } from '../utils/sort';

interface CategoryListProps {
  items: StockpileItem[];
  onSelectCategory: (category: string) => void;
}

function getCategoryIcon(categoryName: string) {
  const name = categoryName.toLowerCase();
  if (name.includes('数码') || name.includes('电子') || name.includes('电脑') || name.includes('手机') || name.includes('监控')) return Monitor;
  if (name.includes('美容') || name.includes('护肤') || name.includes('化妆') || name.includes('洗护')) return Sparkles;
  if (name.includes('药品') || name.includes('医疗') || name.includes('药')) return Pill;
  if (name.includes('食品') || name.includes('零食') || name.includes('饮料') || name.includes('吃')) return Coffee;
  if (name.includes('生活') || name.includes('日用') || name.includes('家')) return Home;
  if (name.includes('书') || name.includes('阅读')) return Book;
  if (name.includes('购物') || name.includes('衣物')) return ShoppingBag;
  return Layers;
}

export default function CategoryList({ items, onSelectCategory }: CategoryListProps) {
  const categories = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    items.forEach((item) => {
      const cat = item.category || '未分类';
      const existing = map.get(cat) || { count: 0, total: 0 };
      map.set(cat, {
        count: existing.count + 1,
        total: existing.total + item.price,
      });
    });
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => customStringCompare(a.name, b.name));
  }, [items]);

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-stone-500 space-y-4 pt-12">
        <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center">
          <PackageOpen size={48} className="text-emerald-400" />
        </div>
        <p className="text-lg font-medium text-stone-800">暂无分类</p>
        <p className="text-sm">添加物品时输入分类即可在此处显示</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent pt-safe">
      <header className="bg-transparent/80 backdrop-blur-md text-stone-900 px-4 py-4 sticky top-0 z-10 h-16 flex items-center pt-[env(safe-area-inset-top,20px)] border-b border-stone-200/50">
        <h1 className="text-2xl font-bold font-serif tracking-tighter">分类</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-32 pt-2 space-y-3">
        {categories.map((cat) => {
          const IconComponent = getCategoryIcon(cat.name);
          return (
            <div
              key={cat.name}
              onClick={() => onSelectCategory(cat.name)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer flex items-center justify-between shrink-0"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-800">{cat.name}</h3>
                  <p className="text-xs text-stone-500">{cat.count} 件物品</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-primary">¥{cat.total.toFixed(2)}</span>
                <ChevronRight size={20} className="text-stone-300" />
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
