"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Search, MoreHorizontal, Eye, Edit, Trash2, Plus, Globe, BookOpen, Video, Image } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock content data
const mockContent = [
  {
    id: "c1",
    title: "Understanding Anxiety: A Comprehensive Guide",
    type: "Article",
    category: "Mental Health",
    status: "Published",
    author: "Dr. Sarah Johnson",
    publishDate: "2024-01-15",
    views: 1250,
    tags: ["anxiety", "mental-health", "guide"]
  },
  {
    id: "c2",
    title: "Coping Strategies for Depression",
    type: "Video",
    category: "Mental Health",
    status: "Draft",
    author: "Dr. Michael Brown",
    publishDate: "2024-01-10",
    views: 890,
    tags: ["depression", "coping", "strategies"]
  },
  {
    id: "c3",
    title: "Family Therapy Techniques",
    type: "Article",
    category: "Family Therapy",
    status: "Published",
    author: "Dr. Emily White",
    publishDate: "2024-01-12",
    views: 2100,
    tags: ["family", "therapy", "techniques"]
  },
  {
    id: "c4",
    title: "Mindfulness Meditation Guide",
    type: "Video",
    category: "Wellness",
    status: "Published",
    author: "Dr. Lisa Chen",
    publishDate: "2024-01-08",
    views: 3400,
    tags: ["mindfulness", "meditation", "wellness"]
  },
  {
    id: "c5",
    title: "Child Psychology: Understanding Development",
    type: "Article",
    category: "Child Psychology",
    status: "Review",
    author: "Dr. David Wilson",
    publishDate: "2024-01-20",
    views: 0,
    tags: ["child", "psychology", "development"]
  }
]

export default function AdminContentPage() {
  const publishedContent = mockContent.filter(c => c.status === "Published")
  const draftContent = mockContent.filter(c => c.status === "Draft")
  const reviewContent = mockContent.filter(c => c.status === "Review")

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Published":
        return <Badge variant="default" className="bg-green-100 text-green-800">Published</Badge>
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>
      case "Review":
        return <Badge variant="outline">Under Review</Badge>
      case "Archived":
        return <Badge variant="destructive">Archived</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Article":
        return <FileText className="h-4 w-4" />
      case "Video":
        return <Video className="h-4 w-4" />
      case "Image":
        return <Image className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Content Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage platform articles, videos, and resources</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Content
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">{mockContent.length}</div>
                <div className="text-sm text-muted-foreground">Total Content</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{publishedContent.length}</div>
                <div className="text-sm text-muted-foreground">Published</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{draftContent.length}</div>
                <div className="text-sm text-muted-foreground">Drafts</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">{mockContent.reduce((sum, c) => sum + c.views, 0)}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content by title or author..."
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="video">Videos</SelectItem>
                <SelectItem value="image">Images</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="review">Under Review</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Content ({mockContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Content</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Published</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockContent.map((content) => (
                <TableRow key={content.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{content.title}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {content.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {content.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{content.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(content.type)}
                      <span className="text-sm">{content.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{content.category}</span>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(content.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{content.author}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{content.views.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{content.publishDate}</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Content
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Content
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Globe className="mr-2 h-4 w-4" />
                          Publish
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Content
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Content Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Content</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockContent
                .sort((a, b) => b.views - a.views)
                .slice(0, 5)
                .map((content, index) => (
                  <div key={content.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{content.title}</div>
                        <div className="text-sm text-muted-foreground">{content.type} • {content.category}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{content.views.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">views</div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Published</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(publishedContent.length / mockContent.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{publishedContent.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Drafts</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(draftContent.length / mockContent.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{draftContent.length}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Under Review</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(reviewContent.length / mockContent.length) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{reviewContent.length}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Content Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-blue-500" />
                <h3 className="font-medium">Mental Health</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                {mockContent.filter(c => c.category === "Mental Health").length} articles
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Video className="h-4 w-4 text-green-500" />
                <h3 className="font-medium">Family Therapy</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                {mockContent.filter(c => c.category === "Family Therapy").length} articles
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Image className="h-4 w-4 text-purple-500" />
                <h3 className="font-medium">Wellness</h3>
              </div>
              <div className="text-sm text-muted-foreground">
                {mockContent.filter(c => c.category === "Wellness").length} articles
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
