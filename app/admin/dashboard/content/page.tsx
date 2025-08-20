"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { FileText, Search, MoreHorizontal, Eye, Edit, Trash2, Plus, Globe, BookOpen, Video, Image, HelpCircle, Calendar, User, Tag } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  author: string
  category: string
  tags: string[]
  status: "draft" | "published" | "archived"
  publishDate?: string
  views: number
  featuredImage?: string
  createdAt: string
  updatedAt: string
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  status: "draft" | "published" | "archived"
  helpful: number
  notHelpful: number
  createdAt: string
  updatedAt: string
}

// Mock data
const mockBlogPosts: BlogPost[] = [
  {
    id: "b1",
    title: "Understanding Anxiety: A Comprehensive Guide",
    content: "Anxiety is a natural response to stress, but when it becomes overwhelming, it can significantly impact daily life...",
    excerpt: "Learn about the different types of anxiety, their symptoms, and effective treatment approaches.",
    author: "Dr. Sarah Johnson",
    category: "Mental Health",
    tags: ["anxiety", "mental-health", "guide"],
    status: "published",
    publishDate: "2024-01-15",
    views: 1250,
    featuredImage: "/images/anxiety-guide.jpg",
    createdAt: "2024-01-10T10:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z"
  },
  {
    id: "b2",
    title: "Coping Strategies for Depression",
    content: "Depression affects millions of people worldwide. Understanding effective coping strategies is crucial...",
    excerpt: "Discover practical techniques to manage depression and improve mental well-being.",
    author: "Dr. Michael Brown",
    category: "Mental Health",
    tags: ["depression", "coping", "strategies"],
    status: "draft",
    views: 0,
    createdAt: "2024-01-12T09:00:00Z",
    updatedAt: "2024-01-12T09:00:00Z"
  },
  {
    id: "b3",
    title: "Family Therapy Techniques",
    content: "Family therapy is a powerful approach to resolving conflicts and improving relationships...",
    excerpt: "Explore effective family therapy techniques that can strengthen family bonds.",
    author: "Dr. Emily White",
    category: "Family Therapy",
    tags: ["family", "therapy", "techniques"],
    status: "published",
    publishDate: "2024-01-12",
    views: 2100,
    createdAt: "2024-01-08T11:00:00Z",
    updatedAt: "2024-01-12T16:00:00Z"
  }
]

const mockFAQs: FAQ[] = [
  {
    id: "f1",
    question: "How do I book my first therapy session?",
    answer: "Booking your first therapy session is simple. You can either call our support line, use our online booking system, or contact us through email. We'll help you find a therapist that matches your needs and schedule.",
    category: "Booking",
    tags: ["booking", "first-session", "therapy"],
    status: "published",
    helpful: 45,
    notHelpful: 2,
    createdAt: "2024-01-05T10:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z"
  },
  {
    id: "f2",
    question: "What types of therapy do you offer?",
    answer: "We offer a wide range of therapy types including Cognitive Behavioral Therapy (CBT), Family Therapy, Couples Therapy, Individual Therapy, and specialized treatments for anxiety, depression, and trauma.",
    category: "Services",
    tags: ["therapy-types", "services", "treatment"],
    status: "published",
    helpful: 67,
    notHelpful: 1,
    createdAt: "2024-01-03T14:00:00Z",
    updatedAt: "2024-01-10T09:00:00Z"
  },
  {
    id: "f3",
    question: "Is online therapy as effective as in-person therapy?",
    answer: "Yes, online therapy has been shown to be just as effective as in-person therapy for many conditions. It offers the same level of professional care with added convenience and accessibility.",
    category: "Online Therapy",
    tags: ["online-therapy", "effectiveness", "virtual"],
    status: "published",
    helpful: 89,
    notHelpful: 3,
    createdAt: "2024-01-01T08:00:00Z",
    updatedAt: "2024-01-08T15:00:00Z"
  },
  {
    id: "f4",
    question: "How much does therapy cost?",
    answer: "Therapy costs vary depending on the type of session and your insurance coverage. We offer sliding scale fees and accept most major insurance plans. Contact us for specific pricing information.",
    category: "Pricing",
    tags: ["cost", "pricing", "insurance"],
    status: "draft",
    helpful: 0,
    notHelpful: 0,
    createdAt: "2024-01-20T11:00:00Z",
    updatedAt: "2024-01-20T11:00:00Z"
  }
]

export default function AdminContentPage() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>(mockBlogPosts)
  const [faqs, setFaqs] = useState<FAQ[]>(mockFAQs)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [showBlogModal, setShowBlogModal] = useState(false)
  const [showFAQModal, setShowFAQModal] = useState(false)
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null)
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null)
  const [activeTab, setActiveTab] = useState("blog")

  // Filter blog posts
  const filteredBlogPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || post.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || post.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Filter FAQs
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || faq.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const publishedBlogPosts = blogPosts.filter(post => post.status === "published")
  const draftBlogPosts = blogPosts.filter(post => post.status === "draft")
  const publishedFAQs = faqs.filter(faq => faq.status === "published")
  const draftFAQs = faqs.filter(faq => faq.status === "draft")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "archived":
        return <Badge variant="destructive">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleCreateBlog = () => {
    setEditingBlog(null)
    setShowBlogModal(true)
  }

  const handleEditBlog = (blog: BlogPost) => {
    setEditingBlog(blog)
    setShowBlogModal(true)
  }

  const handleDeleteBlog = (id: string) => {
    setBlogPosts(prev => prev.filter(post => post.id !== id))
    toast.success("Blog post deleted successfully")
  }

  const handleCreateFAQ = () => {
    setEditingFAQ(null)
    setShowFAQModal(true)
  }

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ(faq)
    setShowFAQModal(true)
  }

  const handleDeleteFAQ = (id: string) => {
    setFaqs(prev => prev.filter(faq => faq.id !== id))
    toast.success("FAQ deleted successfully")
  }

  const handleSaveBlog = (formData: FormData) => {
    const formDataAny = formData as any
    const title = formDataAny.get('title') as string
    const author = formDataAny.get('author') as string
    const category = formDataAny.get('category') as string
    const status = formDataAny.get('status') as string
    const excerpt = formDataAny.get('excerpt') as string
    const content = formDataAny.get('content') as string
    const tags = (formDataAny.get('tags') as string).split(',').map(tag => tag.trim()).filter(tag => tag)

    if (editingBlog) {
      // Update existing blog post
      setBlogPosts(prev => prev.map(post => 
        post.id === editingBlog.id 
          ? {
              ...post,
              title,
              author,
              category,
              status: status as "draft" | "published" | "archived",
              excerpt,
              content,
              tags,
              updatedAt: new Date().toISOString(),
              publishDate: status === 'published' ? new Date().toISOString() : post.publishDate
            }
          : post
      ))
      toast.success("Blog post updated successfully")
    } else {
      // Create new blog post
      const newBlog: BlogPost = {
        id: `blog-${Date.now()}`,
        title,
        author,
        category,
        status: status as "draft" | "published" | "archived",
        excerpt,
        content,
        tags,
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        publishDate: status === 'published' ? new Date().toISOString() : undefined
      }
      setBlogPosts(prev => [...prev, newBlog])
      toast.success("Blog post created successfully")
    }
    setShowBlogModal(false)
    setEditingBlog(null)
  }

  const handleSaveFAQ = (formData: FormData) => {
    const formDataAny = formData as any
    const question = formDataAny.get('question') as string
    const answer = formDataAny.get('answer') as string
    const category = formDataAny.get('category') as string
    const status = formDataAny.get('status') as string
    const tags = (formDataAny.get('tags') as string).split(',').map(tag => tag.trim()).filter(tag => tag)

    if (editingFAQ) {
      // Update existing FAQ
      setFaqs(prev => prev.map(faq => 
        faq.id === editingFAQ.id 
          ? {
              ...faq,
              question,
              answer,
              category,
              status: status as "draft" | "published" | "archived",
              tags,
              updatedAt: new Date().toISOString()
            }
          : faq
      ))
      toast.success("FAQ updated successfully")
    } else {
      // Create new FAQ
      const newFAQ: FAQ = {
        id: `faq-${Date.now()}`,
        question,
        answer,
        category,
        status: status as "draft" | "published" | "archived",
        tags,
        helpful: 0,
        notHelpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setFaqs(prev => [...prev, newFAQ])
      toast.success("FAQ created successfully")
    }
    setShowFAQModal(false)
    setEditingFAQ(null)
  }

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content Management System</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage blog posts and FAQs for the platform</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{blogPosts.length}</div>
                <div className="text-sm text-muted-foreground">Blog Posts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{faqs.length}</div>
                <div className="text-sm text-muted-foreground">FAQs</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{publishedBlogPosts.length + publishedFAQs.length}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{blogPosts.reduce((sum, post) => sum + post.views, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog Posts
          </TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            FAQs
          </TabsTrigger>
        </TabsList>

        {/* Blog Posts Tab */}
        <TabsContent value="blog" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search blog posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(blogPosts.map(post => post.category))).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateBlog} className="ml-4">
              <Plus className="mr-2 h-4 w-4" />
              New Blog Post
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Blog Posts ({filteredBlogPosts.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Published</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBlogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-muted-foreground">{post.excerpt}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {post.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{post.author}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{post.category}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{post.views.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {post.publishDate ? formatDate(post.publishDate) : "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditBlog(post)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Post
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Globe className="mr-2 h-4 w-4" />
                              {post.status === 'published' ? 'Unpublish' : 'Publish'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteBlog(post.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Post
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredBlogPosts.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No blog posts found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria or create a new blog post.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(faqs.map(faq => faq.category))).map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateFAQ} className="ml-4">
              <Plus className="mr-2 h-4 w-4" />
              New FAQ
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>FAQs ({filteredFAQs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                                 <TableHeader>
                   <TableRow>
                     <TableHead>Question</TableHead>
                     <TableHead>Category</TableHead>
                     <TableHead>Status</TableHead>
                     <TableHead>Created</TableHead>
                     <TableHead>Actions</TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filteredFAQs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{faq.question}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {faq.answer.length > 100 ? `${faq.answer.substring(0, 100)}...` : faq.answer}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {faq.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {faq.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{faq.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{faq.category}</span>
                      </TableCell>
                                             <TableCell>
                         {getStatusBadge(faq.status)}
                       </TableCell>
                       <TableCell>
                         <div className="text-sm">{formatDate(faq.createdAt)}</div>
                       </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditFAQ(faq)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit FAQ
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Globe className="mr-2 h-4 w-4" />
                              {faq.status === 'published' ? 'Unpublish' : 'Publish'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteFAQ(faq.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete FAQ
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredFAQs.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No FAQs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria or create a new FAQ.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

             {/* Blog Post Modal */}
       <Dialog open={showBlogModal} onOpenChange={setShowBlogModal}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {editingBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
             </DialogTitle>
           </DialogHeader>
           <form action={handleSaveBlog} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="blog-title">Title</Label>
                 <Input 
                   id="blog-title" 
                   name="title"
                   placeholder="Enter blog post title"
                   defaultValue={editingBlog?.title}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="blog-author">Author</Label>
                 <Input 
                   id="blog-author" 
                   name="author"
                   placeholder="Enter author name"
                   defaultValue={editingBlog?.author}
                   required
                 />
               </div>
             </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="blog-category">Category</Label>
                 <Input 
                   id="blog-category" 
                   name="category"
                   placeholder="Enter custom category (e.g., Mental Health, Wellness & Self-Care)"
                   defaultValue={editingBlog?.category}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="blog-status">Status</Label>
                 <Select name="status" defaultValue={editingBlog?.status} required>
                   <SelectTrigger>
                     <SelectValue placeholder="Select status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="draft">Draft</SelectItem>
                     <SelectItem value="published">Published</SelectItem>
                     <SelectItem value="archived">Archived</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
                         <div className="space-y-2">
               <Label htmlFor="blog-excerpt">Excerpt</Label>
               <Textarea 
                 id="blog-excerpt" 
                 name="excerpt"
                 placeholder="Enter a brief excerpt for the blog post"
                 defaultValue={editingBlog?.excerpt}
                 rows={3}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="blog-content">Content</Label>
               <Textarea 
                 id="blog-content" 
                 name="content"
                 placeholder="Enter the full blog post content"
                 defaultValue={editingBlog?.content}
                 rows={10}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="blog-tags">Tags (comma-separated)</Label>
               <Input 
                 id="blog-tags" 
                 name="tags"
                 placeholder="Enter tags separated by commas"
                 defaultValue={editingBlog?.tags.join(', ')}
               />
             </div>
                         <div className="flex gap-2 pt-4">
               <Button type="submit">
                 {editingBlog ? 'Update Post' : 'Create Post'}
               </Button>
               <Button type="button" variant="outline" onClick={() => setShowBlogModal(false)}>
                 Cancel
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>

             {/* FAQ Modal */}
       <Dialog open={showFAQModal} onOpenChange={setShowFAQModal}>
         <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
           <DialogHeader>
             <DialogTitle>
               {editingFAQ ? 'Edit FAQ' : 'Create New FAQ'}
             </DialogTitle>
           </DialogHeader>
           <form action={handleSaveFAQ} className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label htmlFor="faq-category">Category</Label>
                 <Input 
                   id="faq-category" 
                   name="category"
                   placeholder="Enter custom category (e.g., Booking, Services, Getting Started)"
                   defaultValue={editingFAQ?.category}
                   required
                 />
               </div>
               <div className="space-y-2">
                 <Label htmlFor="faq-status">Status</Label>
                 <Select name="status" defaultValue={editingFAQ?.status} required>
                   <SelectTrigger>
                     <SelectValue placeholder="Select status" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="draft">Draft</SelectItem>
                     <SelectItem value="published">Published</SelectItem>
                     <SelectItem value="archived">Archived</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>
                         <div className="space-y-2">
               <Label htmlFor="faq-question">Question</Label>
               <Input 
                 id="faq-question" 
                 name="question"
                 placeholder="Enter the question"
                 defaultValue={editingFAQ?.question}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="faq-answer">Answer</Label>
               <Textarea 
                 id="faq-answer" 
                 name="answer"
                 placeholder="Enter the answer"
                 defaultValue={editingFAQ?.answer}
                 rows={8}
                 required
               />
             </div>
             <div className="space-y-2">
               <Label htmlFor="faq-tags">Tags (comma-separated)</Label>
               <Input 
                 id="faq-tags" 
                 name="tags"
                 placeholder="Enter tags separated by commas"
                 defaultValue={editingFAQ?.tags.join(', ')}
               />
             </div>
                         <div className="flex gap-2 pt-4">
               <Button type="submit">
                 {editingFAQ ? 'Update FAQ' : 'Create FAQ'}
               </Button>
               <Button type="button" variant="outline" onClick={() => setShowFAQModal(false)}>
                 Cancel
               </Button>
             </div>
           </form>
         </DialogContent>
       </Dialog>
     </div>
   )
 }
