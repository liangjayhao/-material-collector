'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  FileText, Image as ImageIcon, Video, Music, Link2, Plus, Search, Trash2, Edit,
  FolderOpen, Heart, Menu, Upload, CloudUpload, Tag, Clock, Camera, Clipboard
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

// 类型定义
interface Material {
  id: string
  title: string
  content: string | null
  type: string
  tags: string | null
  isFavorite: boolean
  filePath: string | null
  fileName: string | null
  fileSize: number | null
  mimeType: string | null
  categoryId: string | null
  category: { id: string; name: string; icon: string | null; color: string | null } | null
  createdAt: string
  updatedAt: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  _count?: { materials: number }
}

// 类型图标映射
const typeIcons: Record<string, any> = {
  text: FileText,
  image: ImageIcon,
  video: Video,
  audio: Music,
  link: Link2
}

// 类型颜色映射
const typeColors: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700 border-blue-200',
  image: 'bg-green-100 text-green-700 border-green-200',
  video: 'bg-purple-100 text-purple-700 border-purple-200',
  audio: 'bg-orange-100 text-orange-700 border-orange-200',
  link: 'bg-cyan-100 text-cyan-700 border-cyan-200'
}

// 类型名称映射
const typeNames: Record<string, string> = {
  text: '文字',
  image: '图片',
  video: '视频',
  audio: '音频',
  link: '链接'
}

// 格式化文件大小
function formatFileSize(bytes: number | null): string {
  if (!bytes) return ''
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function Home() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showFavorites, setShowFavorites] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'text',
    tags: '',
    categoryId: '',
    isFavorite: false
  })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // 获取材料
  const fetchMaterials = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (selectedType !== 'all') params.append('type', selectedType)
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      if (showFavorites) params.append('favorite', 'true')

      const res = await fetch(`/api/materials?${params}`)
      const data = await res.json()
      setMaterials(data)
    } catch (error) {
      console.error('获取材料失败:', error)
      toast.error('获取材料失败')
    } finally {
      setLoading(false)
    }
  }, [selectedType, selectedCategory, searchQuery, showFavorites])

  // 获取分类
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('获取分类失败:', error)
    }
  }

  useEffect(() => {
    fetchMaterials()
    fetchCategories()
  }, [fetchMaterials])

  // 监听粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) {
            toast.success('检测到粘贴的图片，正在上传...')
            await handleFileUpload(file)
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [selectedCategory])

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()
      if (data.success) {
        // 自动创建材料
        const materialRes = await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: file.name,
            type: data.type,
            filePath: data.filePath,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            categoryId: selectedCategory !== 'all' ? selectedCategory : null
          })
        })

        if (materialRes.ok) {
          toast.success('文件上传成功')
          fetchMaterials()
        }
      }
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    e.target.value = '' // 重置以便再次选择同一文件
  }

  // 拖拽处理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast.error('请输入标题')
      return
    }

    setUploading(true)
    try {
      let filePath = null
      let fileName = null
      let fileSize = null
      let mimeType = null
      let type = formData.type

      // 如果有文件上传
      if (uploadFile) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', uploadFile)

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData
        })

        const uploadData = await uploadRes.json()
        if (uploadData.success) {
          filePath = uploadData.filePath
          fileName = uploadData.fileName
          fileSize = uploadData.fileSize
          mimeType = uploadData.mimeType
          type = uploadData.type
        }
      }

      const body = {
        title: formData.title,
        content: formData.content,
        type,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : null,
        categoryId: formData.categoryId || null,
        isFavorite: formData.isFavorite,
        filePath,
        fileName,
        fileSize,
        mimeType
      }

      if (editingMaterial) {
        await fetch(`/api/materials/${editingMaterial.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        toast.success('更新成功')
      } else {
        await fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        toast.success('创建成功')
      }

      setDialogOpen(false)
      resetForm()
      fetchMaterials()
    } catch (error) {
      console.error('保存失败:', error)
      toast.error('保存失败')
    } finally {
      setUploading(false)
    }
  }

  // 删除材料
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个材料吗？')) return

    try {
      await fetch(`/api/materials/${id}`, { method: 'DELETE' })
      toast.success('删除成功')
      fetchMaterials()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  // 切换收藏
  const toggleFavorite = async (material: Material) => {
    try {
      await fetch(`/api/materials/${material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: material.title,
          content: material.content,
          tags: material.tags,
          categoryId: material.categoryId,
          isFavorite: !material.isFavorite
        })
      })
      fetchMaterials()
    } catch (error) {
      console.error('操作失败:', error)
    }
  }

  // 编辑材料
  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setFormData({
      title: material.title,
      content: material.content || '',
      type: material.type,
      tags: material.tags ? JSON.parse(material.tags).join(', ') : '',
      categoryId: material.categoryId || '',
      isFavorite: material.isFavorite
    })
    setDialogOpen(true)
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      type: 'text',
      tags: '',
      categoryId: '',
      isFavorite: false
    })
    setUploadFile(null)
    setPreviewUrl(null)
    setEditingMaterial(null)
  }

  // 处理文件选择预览
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      // 生成预览URL
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
      // 自动填充标题
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name }))
      }
    }
  }

  // 渲染材料预览
  const renderPreview = (material: Material) => {
    if (material.type === 'image' && material.filePath) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden">
          <img
            src={material.filePath}
            alt={material.title}
            className="w-full h-full object-cover"
          />
        </div>
      )
    }

    if (material.type === 'video' && material.filePath) {
      return (
        <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden flex items-center justify-center">
          <video
            src={material.filePath}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Video className="w-10 h-10 text-white" />
          </div>
        </div>
      )
    }

    if (material.type === 'audio' && material.filePath) {
      return (
        <div className="relative w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-md flex items-center justify-center">
          <Music className="w-12 h-12 text-orange-500" />
        </div>
      )
    }

    if (material.type === 'link') {
      return (
        <div className="relative w-full h-32 bg-gradient-to-br from-cyan-100 to-cyan-200 rounded-md flex items-center justify-center">
          <Link2 className="w-12 h-12 text-cyan-500" />
        </div>
      )
    }

    // 文字类型
    return (
      <div className="relative w-full h-32 bg-muted rounded-md overflow-hidden p-3">
        <p className="text-sm text-muted-foreground line-clamp-4">
          {material.content || '暂无内容'}
        </p>
      </div>
    )
  }

  // 侧边栏内容
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">分类导航</h2>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          <Button
            variant={selectedCategory === 'all' && !showFavorites ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => {
              setSelectedCategory('all')
              setShowFavorites(false)
              setMobileMenuOpen(false)
            }}
          >
            <FolderOpen className="w-4 h-4" />
            全部材料
            <Badge variant="outline" className="ml-auto">{materials.length}</Badge>
          </Button>
          <Button
            variant={showFavorites ? 'secondary' : 'ghost'}
            className="w-full justify-start gap-2"
            onClick={() => {
              setShowFavorites(true)
              setSelectedCategory('all')
              setMobileMenuOpen(false)
            }}
          >
            <Heart className="w-4 h-4 text-red-500" />
            我的收藏
          </Button>

          <div className="h-px bg-border my-2" />

          <div className="px-2 py-1 text-xs text-muted-foreground font-medium">
            自定义分类
          </div>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-2"
              onClick={() => {
                setSelectedCategory(category.id)
                setShowFavorites(false)
                setMobileMenuOpen(false)
              }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: category.color || '#888' }}
              />
              {category.name}
              <Badge variant="outline" className="ml-auto">
                {category._count?.materials || 0}
              </Badge>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )

  return (
    <div
      className="min-h-screen bg-background"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Toaster position="top-center" />

      {/* 隐藏的文件输入 */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageSelect}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleImageSelect}
      />

      {/* 拖拽上传遮罩 */}
      {dragOver && (
        <div className="fixed inset-0 bg-primary/10 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border-2 border-dashed border-primary rounded-xl p-12 text-center">
            <CloudUpload className="w-16 h-16 mx-auto text-primary mb-4" />
            <p className="text-xl font-medium">松开鼠标上传文件</p>
          </div>
        </div>
      )}

      <div className="flex h-screen">
        {/* 桌面端侧边栏 */}
        <aside className="hidden md:flex w-64 border-r bg-card flex-col">
          <SidebarContent />
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <header className="border-b bg-card p-4 space-y-4">
            <div className="flex items-center gap-4">
              {/* 移动端菜单按钮 */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                  <SidebarContent />
                </SheetContent>
              </Sheet>

              <h1 className="text-xl font-bold">资料整理工具</h1>

              <div className="flex-1" />

              {/* 快捷上传按钮 */}
              <div className="flex items-center gap-2">
                {/* 从相册选择图片 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative"
                  onClick={() => imageInputRef.current?.click()}
                  title="从相册选择图片"
                >
                  <ImageIcon className="w-4 h-4" />
                </Button>
                
                {/* 拍照上传 */}
                <Button
                  variant="outline"
                  size="icon"
                  className="relative md:hidden"
                  onClick={() => cameraInputRef.current?.click()}
                  title="拍照上传"
                >
                  <Camera className="w-4 h-4" />
                </Button>

                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open)
                  if (!open) resetForm()
                }}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">添加材料</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMaterial ? '编辑材料' : '添加材料'}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">标题</Label>
                        <Input
                          id="title"
                          placeholder="输入标题"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="type">类型</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">文字</SelectItem>
                            <SelectItem value="image">图片</SelectItem>
                            <SelectItem value="video">视频</SelectItem>
                            <SelectItem value="audio">音频</SelectItem>
                            <SelectItem value="link">链接</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.type === 'text' && (
                        <div className="space-y-2">
                          <Label htmlFor="content">内容</Label>
                          <Textarea
                            id="content"
                            placeholder="输入内容（也可直接粘贴文字）"
                            rows={4}
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          />
                        </div>
                      )}

                      {formData.type === 'image' && (
                        <div className="space-y-3">
                          <Label>上传图片</Label>
                          
                          {/* 图片预览区域 */}
                          {previewUrl ? (
                            <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden">
                              <img
                                src={previewUrl}
                                alt="预览"
                                className="w-full h-full object-contain"
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="absolute top-2 right-2"
                                onClick={() => {
                                  setUploadFile(null)
                                  setPreviewUrl(null)
                                }}
                              >
                                移除
                              </Button>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {/* 从相册选择 */}
                              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                <ImageIcon className="w-6 h-6 mb-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">相册选择</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                              </label>
                              
                              {/* 拍照上传 */}
                              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                <Camera className="w-6 h-6 mb-1 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">拍照上传</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleFileChange}
                                />
                              </label>
                            </div>
                          )}
                          
                          {/* 提示 */}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clipboard className="w-3 h-3" />
                            提示：也可以直接 Ctrl+V 粘贴图片
                          </p>
                          
                          {uploadFile && (
                            <p className="text-sm text-muted-foreground">
                              已选择: {uploadFile.name}
                            </p>
                          )}
                        </div>
                      )}

                      {formData.type === 'video' && (
                        <div className="space-y-2">
                          <Label>上传视频</Label>
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <Video className="w-6 h-6 mb-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">点击选择视频</span>
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                          {uploadFile && (
                            <p className="text-sm text-muted-foreground">
                              已选择: {uploadFile.name}
                            </p>
                          )}
                        </div>
                      )}

                      {formData.type === 'audio' && (
                        <div className="space-y-2">
                          <Label>上传音频</Label>
                          <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <Music className="w-6 h-6 mb-1 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">点击选择音频</span>
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              onChange={handleFileChange}
                            />
                          </label>
                          {uploadFile && (
                            <p className="text-sm text-muted-foreground">
                              已选择: {uploadFile.name}
                            </p>
                          )}
                        </div>
                      )}

                      {formData.type === 'link' && (
                        <div className="space-y-2">
                          <Label htmlFor="content">链接地址</Label>
                          <Input
                            id="content"
                            placeholder="https://..."
                            value={formData.content || ''}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="category">分类</Label>
                        <Select
                          value={formData.categoryId}
                          onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="选择分类" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">无分类</SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">标签 (用逗号分隔)</Label>
                        <Input
                          id="tags"
                          placeholder="标签1, 标签2, ..."
                          value={formData.tags}
                          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="favorite"
                          checked={formData.isFavorite}
                          onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <Label htmlFor="favorite">添加到收藏</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSubmit} disabled={uploading}>
                        {uploading ? '保存中...' : '保存'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索材料..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  <SelectItem value="text">文字</SelectItem>
                  <SelectItem value="image">图片</SelectItem>
                  <SelectItem value="video">视频</SelectItem>
                  <SelectItem value="audio">音频</SelectItem>
                  <SelectItem value="link">链接</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </header>

          {/* 材料列表 */}
          <ScrollArea className="flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : materials.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Upload className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">暂无材料</h3>
                <p className="text-muted-foreground mb-4">
                  点击"添加材料"按钮或拖拽文件到此处上传
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => imageInputRef.current?.click()}>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    选择图片
                  </Button>
                  <Button variant="outline" className="md:hidden" onClick={() => cameraInputRef.current?.click()}>
                    <Camera className="w-4 h-4 mr-2" />
                    拍照上传
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {materials.map((material) => {
                  const TypeIcon = typeIcons[material.type] || FileText
                  return (
                    <Card key={material.id} className="group relative overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="p-3 pb-0">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-medium line-clamp-2 flex-1">
                            {material.title}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-6 w-6"
                            onClick={() => toggleFavorite(material)}
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                material.isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
                              }`}
                            />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-2 space-y-2">
                        {renderPreview(material)}
                        
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge variant="outline" className={typeColors[material.type]}>
                            <TypeIcon className="w-3 h-3 mr-1" />
                            {typeNames[material.type]}
                          </Badge>
                          {material.category && (
                            <Badge variant="secondary">
                              {material.category.name}
                            </Badge>
                          )}
                        </div>

                        {material.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(material.fileSize)}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(material.createdAt)}
                          </span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(material)}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(material.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {material.tags && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {JSON.parse(material.tags).map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                <Tag className="w-2.5 h-2.5 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
