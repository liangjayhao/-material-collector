'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { usePWA } from '@/hooks/use-pwa'

// 资料类型定义
interface Material {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  createdAt: Date
  isFavorite: boolean
  color: string
}

// 预设分类
const categories = [
  { id: 'article', name: '文章', icon: '📖', color: '#5B8DEF' },
  { id: 'idea', name: '灵感', icon: '💡', color: '#F5A623' },
  { id: 'quote', name: '语录', icon: '💬', color: '#7B68EE' },
  { id: 'link', name: '链接', icon: '🔗', color: '#4ECDC4' },
  { id: 'note', name: '笔记', icon: '📝', color: '#FF6B6B' },
  { id: 'image', name: '图片', icon: '🖼️', color: '#95E1D3' },
]

// 模拟数据
const mockMaterials: Material[] = [
  {
    id: '1',
    title: '设计思维的核心原则',
    content: '以用户为中心，快速原型迭代，拥抱失败。设计思维是一种以人为本的创新方法，它借鉴了设计师的工具和方法，将用户需求、技术可行性和商业成功结合起来。核心原则包括：同理心、定义问题、创意构思、原型制作和测试验证。',
    category: 'article',
    tags: ['设计', '方法论'],
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    isFavorite: true,
    color: '#5B8DEF'
  },
  {
    id: '2',
    title: '产品开发灵感',
    content: '可以做一个结合AI的资料整理工具。用户在浏览网页、阅读文章时，可以快速收集有价值的内容，通过AI自动分类和标签化，让零散的信息变成有序的知识库。',
    category: 'idea',
    tags: ['产品', 'AI'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    isFavorite: false,
    color: '#F5A623'
  },
  {
    id: '3',
    title: '"简单是复杂的终极形式"',
    content: '达芬奇说过，简约不是少，而是没有多余。这句话深刻地揭示了设计的本质——好的设计不是简单地减少元素，而是通过精心的筛选和组合，保留最核心、最有价值的部分。',
    category: 'quote',
    tags: ['名言', '设计哲学'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    isFavorite: true,
    color: '#7B68EE'
  },
  {
    id: '4',
    title: 'React最佳实践文章',
    content: 'https://react.dev/learn/thinking-in-react\n\n这篇文章详细介绍了React的组件化思维，包括如何将UI拆分为组件层级、用React构建静态版本、找出UI最简完整state的表示、让state在哪声明等关键步骤。',
    category: 'link',
    tags: ['技术', 'React'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    isFavorite: false,
    color: '#4ECDC4'
  },
]

// 底部导航项
const navItems = [
  { id: 'home', icon: 'house', label: '首页' },
  { id: 'category', icon: 'folder', label: '分类' },
  { id: 'add', icon: 'plus.circle.fill', label: '' },
  { id: 'search', icon: 'magnifyingglass', label: '搜索' },
  { id: 'profile', icon: 'person', label: '我的' },
]

// 从本地存储加载初始数据
function loadInitialMaterials(): Material[] {
  if (typeof window === 'undefined') return mockMaterials
  const saved = localStorage.getItem('materials')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((m: Material) => ({
          ...m,
          createdAt: new Date(m.createdAt)
        }))
      }
    } catch (e) {
      console.error('Failed to load materials:', e)
    }
  }
  return mockMaterials
}

// 格式化时间
function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

// 格式化完整日期
function formatFullDate(date: Date) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Home() {
  const [activeTab, setActiveTab] = useState('home')
  const [materials, setMaterials] = useState<Material[]>(loadInitialMaterials)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', content: '', category: 'note' })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(true)
  const { isInstalled, canInstall, install } = usePWA()
  
  // 详情页相关状态
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState({ title: '', content: '' })
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem('materials', JSON.stringify(materials))
  }, [materials])

  // 添加新资料
  const handleAdd = () => {
    if (!newItem.title.trim()) return
    const categoryInfo = categories.find(c => c.id === newItem.category)
    const newMaterial: Material = {
      id: Date.now().toString(),
      title: newItem.title,
      content: newItem.content,
      category: newItem.category,
      tags: [],
      createdAt: new Date(),
      isFavorite: false,
      color: categoryInfo?.color || '#888'
    }
    setMaterials([newMaterial, ...materials])
    setNewItem({ title: '', content: '', category: 'note' })
    setShowAddSheet(false)
  }

  // 切换收藏
  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setMaterials(materials.map(m => 
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    ))
    // 如果是在详情页，也更新selectedMaterial
    if (selectedMaterial?.id === id) {
      setSelectedMaterial({ ...selectedMaterial, isFavorite: !selectedMaterial.isFavorite })
    }
  }

  // 删除资料
  const handleDelete = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id))
    setSelectedMaterial(null)
    setShowDeleteConfirm(false)
  }

  // 编辑资料
  const handleEdit = () => {
    if (!selectedMaterial) return
    setMaterials(materials.map(m => 
      m.id === selectedMaterial.id 
        ? { ...m, title: editContent.title, content: editContent.content }
        : m
    ))
    setSelectedMaterial({ 
      ...selectedMaterial, 
      title: editContent.title, 
      content: editContent.content 
    })
    setIsEditing(false)
  }

  // 打开详情
  const openDetail = (material: Material) => {
    setSelectedMaterial(material)
    setEditContent({ title: material.title, content: material.content })
    setIsEditing(false)
  }

  // 过滤资料
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = searchQuery === '' || 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === null || m.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 渲染资料卡片（可复用）
  const renderMaterialCard = (material: Material, showFavorite: boolean = true) => (
    <div
      key={material.id}
      onClick={() => openDetail(material)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: material.color + '20' }}
        >
          {categories.find(c => c.id === material.category)?.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{material.title}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{material.content}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400">{formatTime(material.createdAt)}</span>
            {material.tags.map(tag => (
              <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
        {showFavorite && (
          <button 
            onClick={(e) => toggleFavorite(material.id, e)}
            className="text-xl flex-shrink-0 active:scale-110 transition-transform"
          >
            {material.isFavorite ? '⭐' : '☆'}
          </button>
        )}
      </div>
    </div>
  )

  // 渲染详情弹窗
  const renderDetailSheet = () => (
    <div 
      className={cn(
        "fixed inset-0 z-50 transition-all duration-300",
        selectedMaterial ? "visible" : "invisible"
      )}
    >
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          selectedMaterial ? "opacity-100" : "opacity-0"
        )}
        onClick={() => {
          setSelectedMaterial(null)
          setIsEditing(false)
          setShowDeleteConfirm(false)
        }}
      />
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300",
          selectedMaterial ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: '90vh' }}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {selectedMaterial && (
          <div className="px-5 pb-8 max-h-[80vh] overflow-auto">
            {/* 顶部操作栏 */}
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => {
                  setSelectedMaterial(null)
                  setIsEditing(false)
                  setShowDeleteConfirm(false)
                }}
                className="text-blue-500 font-medium"
              >
                关闭
              </button>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => toggleFavorite(selectedMaterial.id)}
                  className="text-2xl active:scale-110 transition-transform"
                >
                  {selectedMaterial.isFavorite ? '⭐' : '☆'}
                </button>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-blue-500 font-medium"
                  >
                    编辑
                  </button>
                )}
              </div>
            </div>

            {/* 分类和日期 */}
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: selectedMaterial.color + '20' }}
              >
                <span>{categories.find(c => c.id === selectedMaterial.category)?.icon}</span>
                <span className="text-sm font-medium" style={{ color: selectedMaterial.color }}>
                  {categories.find(c => c.id === selectedMaterial.category)?.name}
                </span>
              </div>
              <span className="text-sm text-gray-400">
                {formatFullDate(selectedMaterial.createdAt)}
              </span>
            </div>

            {/* 内容区域 */}
            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="text"
                  value={editContent.title}
                  onChange={(e) => setEditContent({ ...editContent, title: e.target.value })}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="标题"
                />
                <textarea
                  value={editContent.content}
                  onChange={(e) => setEditContent({ ...editContent, content: e.target.value })}
                  className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none min-h-[200px]"
                  placeholder="内容"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setEditContent({ title: selectedMaterial.title, content: selectedMaterial.content })
                    }}
                    className="flex-1 py-3 rounded-xl font-medium bg-gray-100 text-gray-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editContent.title.trim()}
                    className={cn(
                      "flex-1 py-3 rounded-xl font-medium transition-all",
                      editContent.title.trim()
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    )}
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedMaterial.title}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedMaterial.content}
                </p>

                {/* 标签 */}
                {selectedMaterial.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                    {selectedMaterial.tags.map(tag => (
                      <span 
                        key={tag} 
                        className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 删除按钮 */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  {showDeleteConfirm ? (
                    <div className="bg-red-50 rounded-xl p-4">
                      <p className="text-red-600 text-center mb-3">确定要删除这条资料吗？</p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-3 rounded-xl font-medium bg-white text-gray-700 border border-gray-200"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleDelete(selectedMaterial.id)}
                          className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-3 rounded-xl font-medium text-red-500 bg-red-50 active:bg-red-100 transition-colors"
                    >
                      删除此资料
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // 渲染首页内容
  const renderHomeContent = () => (
    <div className="flex-1 overflow-auto pb-20">
      {/* 顶部标题 */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">我的资料库</h1>
        <p className="text-gray-500 text-sm mt-1">随时记录，轻松整理</p>
      </div>

      {/* 快速添加入口 */}
      <div className="px-5 mb-6">
        <button 
          onClick={() => setShowAddSheet(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-4 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform"
        >
          <span className="text-xl">✨</span>
          <span className="font-medium">快速收集资料</span>
        </button>
      </div>

      {/* 分类快捷入口 */}
      <div className="px-5 mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {categories.slice(0, 4).map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id)
                setActiveTab('category')
              }}
              className="flex-shrink-0 bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 active:bg-gray-100 transition-colors"
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="text-sm font-medium text-gray-700">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 最近资料 */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">最近收集</h2>
          <button className="text-blue-500 text-sm font-medium">查看全部</button>
        </div>

        <div className="space-y-3">
          {materials.slice(0, 4).map(material => renderMaterialCard(material))}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">本周收集</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{materials.length} 条</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="flex gap-4 mt-4 pt-4 border-t border-gray-200">
            <div className="flex-1">
              <p className="text-gray-400 text-xs">文章</p>
              <p className="text-lg font-semibold text-gray-700">{materials.filter(m => m.category === 'article').length}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs">灵感</p>
              <p className="text-lg font-semibold text-gray-700">{materials.filter(m => m.category === 'idea').length}</p>
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs">收藏</p>
              <p className="text-lg font-semibold text-gray-700">{materials.filter(m => m.isFavorite).length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // 渲染分类内容
  const renderCategoryContent = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">分类</h1>
        <p className="text-gray-500 text-sm mt-1">按类型浏览资料</p>
      </div>

      <div className="px-5 grid grid-cols-2 gap-3">
        {categories.map(cat => {
          const count = materials.filter(m => m.category === cat.id).length
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              className={cn(
                "bg-white rounded-2xl p-4 text-left shadow-sm border transition-all active:scale-[0.98]",
                selectedCategory === cat.id 
                  ? "border-blue-500 ring-2 ring-blue-500/20" 
                  : "border-gray-100"
              )}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-3"
                style={{ backgroundColor: cat.color + '20' }}
              >
                {cat.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{cat.name}</h3>
              <p className="text-gray-400 text-sm mt-1">{count} 条资料</p>
            </button>
          )
        })}
      </div>

      {selectedCategory && (
        <div className="px-5 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {categories.find(c => c.id === selectedCategory)?.name}
            </h2>
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-blue-500 text-sm"
            >
              清除筛选
            </button>
          </div>
          <div className="space-y-3">
            {filteredMaterials.map(material => renderMaterialCard(material, false))}
          </div>
        </div>
      )}
    </div>
  )

  // 渲染搜索内容
  const renderSearchContent = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">搜索</h1>
        <p className="text-gray-500 text-sm mt-1">快速找到你需要的资料</p>
      </div>

      <div className="px-5 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜索标题、内容或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 rounded-xl px-4 py-3 pl-10 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      {/* 热门标签 */}
      <div className="px-5 mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-3">热门标签</h3>
        <div className="flex flex-wrap gap-2">
          {['设计', '产品', 'AI', '技术', '方法论'].map(tag => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm active:bg-gray-200"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* 搜索结果 */}
      {searchQuery && (
        <div className="px-5">
          <p className="text-sm text-gray-500 mb-3">
            找到 {filteredMaterials.length} 条结果
          </p>
          <div className="space-y-3">
            {filteredMaterials.map(material => renderMaterialCard(material))}
          </div>
        </div>
      )}
    </div>
  )

  // 渲染个人中心
  const renderProfileContent = () => (
    <div className="flex-1 overflow-auto pb-20">
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-[28px] font-semibold text-gray-900 tracking-tight">我的</h1>
      </div>

      {/* 用户卡片 */}
      <div className="px-5 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
              👤
            </div>
            <div>
              <h2 className="text-xl font-semibold">资料收集达人</h2>
              <p className="text-blue-100 text-sm">坚持记录第 7 天</p>
            </div>
          </div>
        </div>
      </div>

      {/* 统计 */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
            <p className="text-gray-500 text-sm mt-1">总资料</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{materials.filter(m => m.isFavorite).length}</p>
            <p className="text-gray-500 text-sm mt-1">收藏</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            <p className="text-gray-500 text-sm mt-1">分类</p>
          </div>
        </div>
      </div>

      {/* 设置列表 */}
      <div className="px-5">
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          {[
            { icon: '🔔', title: '提醒设置', desc: '设置每日整理提醒' },
            { icon: '☁️', title: '云端同步', desc: '已开启' },
            { icon: '🎨', title: '主题设置', desc: '跟随系统' },
            { icon: '📤', title: '导出数据', desc: '' },
          ].map((item, index) => (
            <button
              key={item.title}
              className={cn(
                "w-full px-4 py-4 flex items-center gap-3 active:bg-gray-50 text-left",
                index !== 3 && "border-b border-gray-100"
              )}
            >
              <span className="text-xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.title}</p>
                {item.desc && <p className="text-gray-400 text-sm">{item.desc}</p>}
              </div>
              <span className="text-gray-300">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  // 渲染添加弹窗
  const renderAddSheet = () => (
    <div 
      className={cn(
        "fixed inset-0 z-50 transition-all duration-300",
        showAddSheet ? "visible" : "invisible"
      )}
    >
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          showAddSheet ? "opacity-100" : "opacity-0"
        )}
        onClick={() => setShowAddSheet(false)}
      />
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl transition-transform duration-300",
          showAddSheet ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: '85vh' }}
      >
        {/* 拖动条 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">快速收集</h2>
            <button 
              onClick={() => setShowAddSheet(false)}
              className="text-gray-400 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* 分类选择 */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-500 mb-2">选择类型</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNewItem({ ...newItem, category: cat.id })}
                  className={cn(
                    "flex-shrink-0 px-4 py-2 rounded-full flex items-center gap-2 transition-all",
                    newItem.category === cat.id
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700"
                  )}
                >
                  <span>{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 标题输入 */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="标题（必填）"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* 内容输入 */}
          <div className="mb-6">
            <textarea
              placeholder="内容或备注..."
              value={newItem.content}
              onChange={(e) => setNewItem({ ...newItem, content: e.target.value })}
              rows={4}
              className="w-full bg-gray-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            />
          </div>

          {/* 保存按钮 */}
          <button
            onClick={handleAdd}
            disabled={!newItem.title.trim()}
            className={cn(
              "w-full py-4 rounded-xl font-medium transition-all",
              newItem.title.trim()
                ? "bg-blue-500 text-white active:bg-blue-600"
                : "bg-gray-200 text-gray-400"
            )}
          >
            保存资料
          </button>
        </div>
      </div>
    </div>
  )

  // 主渲染
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {/* iPhone 模拟框架 */}
      <div className="relative w-full max-w-[390px] h-[844px] bg-white rounded-[50px] shadow-2xl overflow-hidden border-[12px] border-gray-900">
        {/* 动态岛 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[120px] h-[35px] bg-black rounded-full z-50" />
        
        {/* 内容区域 */}
        <div className="h-full flex flex-col bg-gray-50">
          {/* 状态栏 */}
          <div className="h-12 flex items-end justify-between px-8 pb-1 bg-gray-50">
            <span className="text-sm font-medium text-gray-900">9:41</span>
            <div className="flex items-center gap-1">
              <span className="text-sm">📶</span>
              <span className="text-sm">wifi</span>
              <span className="text-sm">🔋</span>
            </div>
          </div>

          {/* 页面内容 */}
          {activeTab === 'home' && renderHomeContent()}
          {activeTab === 'category' && renderCategoryContent()}
          {activeTab === 'search' && renderSearchContent()}
          {activeTab === 'profile' && renderProfileContent()}

          {/* 底部导航栏 */}
          <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200">
            <div className="flex items-center justify-around py-2 pb-6">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'add') {
                      setShowAddSheet(true)
                    } else {
                      setActiveTab(item.id)
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[60px]",
                    item.id === 'add' && "text-blue-500"
                  )}
                >
                  {item.id === 'add' ? (
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-500/30 -mt-4">
                      +
                    </div>
                  ) : (
                    <>
                      <span className={cn(
                        "text-xl",
                        activeTab === item.id ? "text-blue-500" : "text-gray-400"
                      )}>
                        {item.id === 'home' && '🏠'}
                        {item.id === 'category' && '📁'}
                        {item.id === 'search' && '🔍'}
                        {item.id === 'profile' && '👤'}
                      </span>
                      <span className={cn(
                        "text-[10px]",
                        activeTab === item.id ? "text-blue-500 font-medium" : "text-gray-400"
                      )}>
                        {item.label}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>
            {/* Home Indicator */}
            <div className="flex justify-center pb-2">
              <div className="w-32 h-1 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>

        {/* 添加弹窗 */}
        {renderAddSheet()}
        
        {/* 详情弹窗 */}
        {renderDetailSheet()}
      </div>

      {/* 功能说明 */}
      <div className="hidden lg:block absolute left-8 top-1/2 -translate-y-1/2 max-w-[280px]">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ 极简资料整理</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start gap-2">
            <span className="text-blue-500">●</span>
            <p><strong>一键收集</strong> - 快速保存零散资料</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-yellow-500">●</span>
            <p><strong>智能分类</strong> - 6大类型自动归类</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-500">●</span>
            <p><strong>全文搜索</strong> - 标签、内容快速检索</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-green-500">●</span>
            <p><strong>收藏标记</strong> - 重要资料一目了然</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-red-500">●</span>
            <p><strong>编辑删除</strong> - 随时管理你的资料</p>
          </div>
        </div>

        {/* PWA 状态 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm font-medium text-blue-900">PWA 状态</p>
          <div className="mt-2 space-y-1 text-xs">
            <p className={isInstalled ? 'text-green-600' : 'text-gray-500'}>
              {isInstalled ? '✅ 已安装到设备' : '📱 未安装'}
            </p>
            {canInstall && !isInstalled && (
              <button 
                onClick={install}
                className="mt-2 w-full bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
              >
                安装到桌面
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 安装提示横幅 */}
      {canInstall && !isInstalled && showInstallBanner && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between z-50 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              📱
            </div>
            <div>
              <p className="font-medium">安装「资料收集」</p>
              <p className="text-sm text-blue-100">添加到主屏幕，体验更流畅</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInstallBanner(false)}
              className="px-3 py-1 text-sm text-blue-100"
            >
              稍后
            </button>
            <button 
              onClick={() => {
                install()
                setShowInstallBanner(false)
              }}
              className="px-4 py-2 bg-white text-blue-500 rounded-lg text-sm font-medium"
            >
              安装
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
