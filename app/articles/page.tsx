"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Search, ArrowRight } from "lucide-react"
import LandingNavbar from "@/components/landing-navbar"

// Sample blog posts data
const blogPosts = [
  {
    id: "1",
    title: "Understanding Anxiety: A Comprehensive Guide to Mental Wellness",
    excerpt: "Anxiety affects millions of people worldwide. Learn about the different types of anxiety, common triggers, and effective coping strategies to manage your mental health.",
    content: "Anxiety is one of the most common mental health conditions affecting people today. It can manifest in various forms, from generalized anxiety disorder to panic attacks and social anxiety. Understanding the root causes and learning effective coping mechanisms is crucial for managing anxiety and improving overall mental wellness...",
    author: "Dr. Sarah Johnson",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "Mental Health",
    image: "/placeholder.jpg",
    tags: ["Anxiety", "Mental Health", "Wellness", "Coping Strategies"]
  },
  {
    id: "2",
    title: "The Power of Mindfulness: Transform Your Daily Life",
    excerpt: "Discover how mindfulness practices can reduce stress, improve focus, and enhance your overall quality of life through simple daily exercises.",
    content: "Mindfulness is more than just a buzzword—it's a powerful practice that can transform how you experience life. By learning to be present in the moment, you can reduce stress, improve your relationships, and find greater peace in your daily routine...",
    author: "Dr. Michael Chen",
    date: "2024-01-12",
    readTime: "6 min read",
    category: "Mindfulness",
    image: "/placeholder.jpg",
    tags: ["Mindfulness", "Meditation", "Stress Relief", "Wellness"]
  },
  {
    id: "3",
    title: "Building Healthy Relationships: Communication is Key",
    excerpt: "Learn the essential communication skills that can strengthen your relationships with family, friends, and partners.",
    content: "Healthy relationships are built on a foundation of effective communication. Whether it's with your partner, family members, or friends, learning to express yourself clearly and listen actively can transform your connections...",
    author: "Dr. Emily Rodriguez",
    date: "2024-01-10",
    readTime: "10 min read",
    category: "Relationships",
    image: "/placeholder.jpg",
    tags: ["Relationships", "Communication", "Family", "Partnership"]
  },
  {
    id: "4",
    title: "Depression: Breaking the Stigma and Finding Hope",
    excerpt: "Depression is a serious but treatable condition. Learn about the signs, symptoms, and available treatment options.",
    content: "Depression affects people of all ages and backgrounds, yet it remains one of the most misunderstood mental health conditions. Breaking the stigma starts with understanding what depression really is and recognizing that help is available...",
    author: "Dr. James Wilson",
    date: "2024-01-08",
    readTime: "12 min read",
    category: "Mental Health",
    image: "/placeholder.jpg",
    tags: ["Depression", "Mental Health", "Treatment", "Recovery"]
  },
  {
    id: "5",
    title: "Stress Management: Practical Techniques for Busy Lives",
    excerpt: "In today's fast-paced world, stress management is essential. Discover practical techniques that fit into your busy schedule.",
    content: "Modern life comes with unprecedented levels of stress, from work pressures to personal responsibilities. Learning to manage stress effectively is crucial for maintaining both physical and mental health...",
    author: "Dr. Lisa Thompson",
    date: "2024-01-05",
    readTime: "7 min read",
    category: "Stress Management",
    image: "/placeholder.jpg",
    tags: ["Stress", "Work-Life Balance", "Self-Care", "Productivity"]
  }
]

const categories = ["All", "Mental Health", "Mindfulness", "Relationships", "Stress Management"]

export default function ArticlesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Mental Health & Wellness Articles
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Expert insights, practical advice, and evidence-based strategies for your mental health journey
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className="text-sm"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-shadow duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-[#A66B24] transition-colors">
                  <Link href={`/articles/${post.id}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription className="text-gray-600 line-clamp-3">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {post.author}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(post.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Link href={`/articles/${post.id}`}>
                    <Button variant="ghost" size="sm" className="group-hover:text-[#A66B24]">
                      Read More
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}
