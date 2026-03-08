import React, { useMemo } from 'react';
import { StockpileItem } from '../types';
import { Layers, ChevronRight, PackageOpen } from 'lucide-react';
import { customStringCompare } from '../utils/sort';

interface CategoryListProps {
  items: StockpileItem[];
  onSelectCategory: (category: string) => void;
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
    <div className="flex flex-col h-full bg-stone-100 pt-safe">
      <header className="bg-stone-100/80 backdrop-blur-md text-stone-900 px-4 py-4 sticky top-0 z-10 h-16 flex items-center pt-[env(safe-area-inset-top,20px)] border-b border-stone-200/50">
        <h1 className="text-xl font-semibold tracking-tight">分类</h1>
      </header>
      <main className="flex-1 overflow-y-auto px-4 pb-32 pt-2 space-y-3">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => onSelectCategory(cat.name)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-transparent hover:border-primary/20 hover:shadow-md transition-all cursor-pointer flex items-center justify-between shrink-0"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Layers size={24} />
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
        ))}
      </main>
    </div>
  );
}
