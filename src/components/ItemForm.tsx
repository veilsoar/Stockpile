import React, { useState, useRef, useEffect } from 'react';
import { StockpileItem } from '../types';
import { Camera, Image as ImageIcon, ArrowLeft, Save } from 'lucide-react';

interface ItemFormProps {
  initialItem?: StockpileItem;
  onSave: (item: StockpileItem) => void;
  onCancel: () => void;
}

export default function ItemForm({ initialItem, onSave, onCancel }: ItemFormProps) {
  useEffect(() => {
    const handlePopState = () => {
      onCancel();
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onCancel]);

  const [name, setName] = useState(initialItem?.name || '');
  const [category, setCategory] = useState(initialItem?.category || '');
  const [purchaseDate, setPurchaseDate] = useState(
    initialItem?.purchaseDate
      ? new Date(initialItem.purchaseDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [price, setPrice] = useState(initialItem?.price?.toString() || '');
  const [platform, setPlatform] = useState(initialItem?.platform || '');
  const [notes, setNotes] = useState(initialItem?.notes || '');
  const [imageUri, setImageUri] = useState(initialItem?.imageUri || '');
  const [expiryDate, setExpiryDate] = useState(
    initialItem?.expiryDate
      ? new Date(initialItem.expiryDate).toISOString().split('T')[0]
      : ''
  );
  const [tagsString, setTagsString] = useState(initialItem?.tags?.join(', ') || '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      id: initialItem?.id || crypto.randomUUID(),
      name,
      category,
      purchaseDate: new Date(purchaseDate).getTime(),
      price: parseFloat(price) || 0,
      platform,
      notes,
      imageUri,
      expiryDate: expiryDate ? new Date(expiryDate).getTime() : undefined,
      tags: tagsString.split(',').map(t => t.trim()).filter(Boolean),
    });
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      {/* Top App Bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-stone-100 text-stone-900 shadow-sm sticky top-0 z-10 pt-[env(safe-area-inset-top,24px)]">
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-full hover:bg-stone-200 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-medium">{initialItem ? '编辑物品' : '添加物品'}</h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
        >
          <Save size={20} />
          <span>保存</span>
        </button>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Image Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-full aspect-square max-w-sm bg-stone-200 rounded-3xl overflow-hidden relative flex items-center justify-center border-2 border-dashed border-stone-300">
            {imageUri ? (
              <img src={imageUri} alt="Item" className="w-full h-full object-cover" />
            ) : (
              <div className="text-stone-400 flex flex-col items-center gap-2">
                <ImageIcon size={48} />
                <span>暂无照片</span>
              </div>
            )}
            {imageUri && (
              <button
                type="button"
                onClick={() => setImageUri('')}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm"
              >
                移除
              </button>
            )}
          </div>
          
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-800 rounded-full font-medium hover:bg-stone-300 transition-colors"
            >
              <Camera size={20} />
              <span>拍照</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-stone-200 text-stone-800 rounded-full font-medium hover:bg-stone-300 transition-colors"
            >
              <ImageIcon size={20} />
              <span>相册</span>
            </button>
            
            {/* Hidden inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              className="hidden"
              onChange={handleImageUpload}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-stone-100">
          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">物品名称 *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="例如：MacBook Pro"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">分类</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="例如：数码"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">购买平台</label>
              <input
                type="text"
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                placeholder="例如：淘宝"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">购买日期</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-600 mb-1">过期日期 (选填)</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">购买金额</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">标签 (用逗号分隔)</label>
            <input
              type="text"
              value={tagsString}
              onChange={(e) => setTagsString(e.target.value)}
              className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              placeholder="例如：高频使用, 备用品"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-600 mb-1">备注</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 bg-stone-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
              placeholder="添加一些备注信息..."
            />
          </div>
        </div>
        
        {/* Bottom padding for scrolling */}
        <div className="h-8"></div>
      </form>
    </div>
  );
}
