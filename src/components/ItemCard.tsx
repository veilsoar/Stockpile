import React, { useMemo, useRef } from 'react';
import { StockpileItem } from '../types';
import { Image as ImageIcon } from 'lucide-react';

interface ItemCardProps {
  item: StockpileItem;
  index: number;
  isSelected: boolean;
  isSelectionMode: boolean;
  isDarkMode: boolean;
  onClick: () => void;
  onLongPress: () => void;
  onTagClick: (tag: string, e: React.MouseEvent) => void;
}

export const calculateDailyCost = (price: number, purchaseDate: number): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const purchase = new Date(purchaseDate);
  const purchaseDay = new Date(purchase.getFullYear(), purchase.getMonth(), purchase.getDate()).getTime();
  
  const diffTime = Math.abs(today - purchaseDay);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const daysOwned = diffDays + 1;
  return price / daysOwned;
};

export default React.memo(function ItemCard({ item, index, isSelected, isSelectionMode, isDarkMode, onClick, onLongPress, onTagClick }: ItemCardProps) {
  const dailyCost = useMemo(() => calculateDailyCost(item.price, item.purchaseDate), [item.price, item.purchaseDate]);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Expiry Logic
  const { cardBg, borderColor, expiryText } = useMemo(() => {
    let bg = isDarkMode ? 'bg-stone-800/70' : 'bg-white/70';
    let border = isDarkMode ? 'border-stone-700/40' : 'border-white/40';
    let text = null;

    if (item.expiryDate) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const daysUntil = Math.ceil((item.expiryDate - todayStart) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        bg = isDarkMode ? 'bg-red-900/30' : 'bg-red-50/70';
        border = isDarkMode ? 'border-red-900/50' : 'border-red-200/50';
        text = <span className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} font-medium text-[10px]`}>已过期 {Math.abs(daysUntil)} 天</span>;
      } else if (daysUntil === 0) {
        bg = isDarkMode ? 'bg-red-900/30' : 'bg-red-50/70';
        border = isDarkMode ? 'border-red-800/50' : 'border-red-300/50';
        text = <span className={`${isDarkMode ? 'text-red-400' : 'text-red-600'} font-bold text-[10px]`}>今天到期</span>;
      } else if (daysUntil <= 30) {
        bg = isDarkMode ? 'bg-orange-900/30' : 'bg-orange-50/70';
        border = isDarkMode ? 'border-orange-900/50' : 'border-orange-200/50';
        text = <span className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'} font-medium text-[10px]`}>{daysUntil} 天后到期</span>;
      }
    }
    return { cardBg: bg, borderColor: border, expiryText: text };
  }, [item.expiryDate, isDarkMode]);
  
  return (
    <div
      className={`relative ${cardBg} backdrop-blur-md rounded-2xl p-2.5 shadow-sm border transition-all cursor-pointer flex flex-row items-center transform-gpu ${
        isSelected ? 'border-emerald-500 bg-emerald-50/80' : `${borderColor} hover:shadow-md`
      }`}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onLongPress();
      }}
      onTouchStart={() => {
        longPressTimer.current = setTimeout(() => onLongPress(), 500);
      }}
      onTouchEnd={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }}
      onTouchMove={() => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }}
    >
      {/* Thumbnail (60x60) */}
      <div className={`w-[60px] h-[60px] ${isDarkMode ? 'bg-stone-700' : 'bg-stone-100'} rounded-xl relative shrink-0 overflow-hidden`}>
        {item.imageUri ? (
          <img src={item.imageUri} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'text-stone-500' : 'text-stone-300'}`}>
            <ImageIcon size={24} />
          </div>
        )}
        
        {/* Selection Overlay */}
        {isSelectionMode && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-white bg-black/20'
            }`}>
              {isSelected && <span className="text-white text-sm">✓</span>}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="ml-3 flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start mb-0.5">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-stone-200' : 'text-stone-800'} truncate pr-2`}>{item.name}</h3>
          <span className={`text-sm font-bold ${isDarkMode ? 'text-stone-200' : 'text-stone-800'} shrink-0`}>¥{item.price.toFixed(2)}</span>
        </div>
        
        <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-stone-400' : 'text-stone-500'}`}>
          <div className="flex items-center gap-1.5 truncate">
            <span>{new Date(item.purchaseDate).toLocaleDateString()}</span>
            {expiryText && (
              <>
                <span>·</span>
                {expiryText}
              </>
            )}
          </div>
          <div className={`flex items-center gap-1 ${isDarkMode ? 'text-emerald-400 bg-emerald-900/30' : 'text-emerald-700 bg-emerald-50'} font-medium shrink-0 px-1.5 py-0.5 rounded-md ml-2`}>
            <span>日均 ¥{dailyCost.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {item.tags.map(tag => (
              <span 
                key={tag} 
                onClick={(e) => onTagClick(tag, e)}
                className={`inline-flex items-center text-[9px] font-medium ${isDarkMode ? 'bg-stone-700 text-stone-300 hover:bg-stone-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'} px-1.5 py-0.5 rounded`}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
})
