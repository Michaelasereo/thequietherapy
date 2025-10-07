"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, User, ArrowLeft, Share2, Bookmark, Heart } from "lucide-react"
import LandingNavbar from "@/components/landing-navbar"

// Sample blog posts data (same as articles page)
const blogPosts = [
  {
    id: "1",
    title: "Understanding Anxiety: A Comprehensive Guide to Mental Wellness",
    excerpt: "Anxiety affects millions of people worldwide. Learn about the different types of anxiety, common triggers, and effective coping strategies to manage your mental health.",
    content: `Anxiety is one of the most common mental health conditions affecting people today. It can manifest in various forms, from generalized anxiety disorder to panic attacks and social anxiety. Understanding the root causes and learning effective coping mechanisms is crucial for managing anxiety and improving overall mental wellness.

## What is Anxiety?

Anxiety is a natural response to stress and danger. It's your body's way of preparing you to face a challenging situation. However, when anxiety becomes excessive, persistent, and interferes with daily life, it may indicate an anxiety disorder.

## Types of Anxiety Disorders

### Generalized Anxiety Disorder (GAD)
People with GAD experience excessive worry about everyday situations. This worry is often unrealistic or out of proportion to the actual circumstances.

### Panic Disorder
Panic disorder is characterized by sudden, intense episodes of fear that trigger severe physical reactions when there's no real danger or apparent cause.

### Social Anxiety Disorder
Social anxiety disorder involves intense fear of social situations and being judged or embarrassed by others.

## Common Symptoms

- Excessive worrying
- Restlessness or feeling on edge
- Difficulty concentrating
- Irritability
- Muscle tension
- Sleep problems
- Rapid heartbeat
- Sweating
- Trembling

## Coping Strategies

### 1. Deep Breathing Exercises
Practice deep breathing techniques to calm your nervous system. Try the 4-7-8 breathing method: inhale for 4 counts, hold for 7, exhale for 8.

### 2. Progressive Muscle Relaxation
Systematically tense and relax different muscle groups to reduce physical tension.

### 3. Mindfulness and Meditation
Regular mindfulness practice can help you stay present and reduce anxious thoughts.

### 4. Regular Exercise
Physical activity releases endorphins and can help reduce anxiety symptoms.

### 5. Healthy Sleep Habits
Prioritize good sleep hygiene to ensure adequate rest and recovery.

## When to Seek Professional Help

If anxiety is significantly impacting your daily life, relationships, or work, it's important to seek professional help. A mental health professional can provide:

- Proper diagnosis
- Evidence-based treatment options
- Medication management if needed
- Cognitive-behavioral therapy (CBT)
- Other therapeutic approaches

## Treatment Options

### Therapy
Cognitive-behavioral therapy (CBT) is particularly effective for anxiety disorders. It helps you identify and change negative thought patterns and behaviors.

### Medication
In some cases, medication may be prescribed to help manage symptoms. This should always be done under the supervision of a qualified healthcare provider.

### Lifestyle Changes
Simple lifestyle modifications can make a significant difference:
- Regular exercise
- Balanced diet
- Adequate sleep
- Stress management techniques
- Limiting caffeine and alcohol

## Supporting Someone with Anxiety

If you know someone struggling with anxiety:

1. **Listen without judgment** - Let them know you're there to support them
2. **Educate yourself** - Learn about anxiety disorders to better understand their experience
3. **Encourage professional help** - Suggest they speak with a mental health professional
4. **Be patient** - Recovery takes time and everyone's journey is different
5. **Take care of yourself** - Supporting someone with anxiety can be challenging, so make sure to prioritize your own mental health

## Conclusion

Anxiety is a treatable condition, and with the right support and strategies, you can learn to manage it effectively. Remember that seeking help is a sign of strength, not weakness. Whether through therapy, medication, lifestyle changes, or a combination of approaches, there are many paths to better mental health.

If you're struggling with anxiety, know that you're not alone. Millions of people experience anxiety, and there are resources and professionals available to help you on your journey to wellness.`,
    author: "Dr Asere Opeyemi",
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
    author: "Dr Asere Opeyemi",
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
    author: "Dr Asere Opeyemi",
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
    author: "Dr Asere Opeyemi",
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
    author: "Dr Asere Opeyemi",
    date: "2024-01-05",
    readTime: "7 min read",
    category: "Stress Management",
    image: "/placeholder.jpg",
    tags: ["Stress", "Work-Life Balance", "Self-Care", "Productivity"]
  }
]

export default function ArticlePage() {
  const params = useParams()
  const articleId = params.id as string
  
  const currentArticle = blogPosts.find(post => post.id === articleId)
  
  if (!currentArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article not found</h1>
          <Link href="/articles">
            <Button>Back to Articles</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Find similar posts based on category and tags
  const similarPosts = blogPosts
    .filter(post => post.id !== articleId)
    .filter(post => 
      post.category === currentArticle.category || 
      post.tags.some(tag => currentArticle.tags.includes(tag))
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-white">
      <LandingNavbar />
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/articles" className="inline-flex items-center text-[#A66B24] hover:text-[#8B5A1F] mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Articles
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Article Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{currentArticle.category}</Badge>
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="h-4 w-4 mr-1" />
              {currentArticle.readTime}
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentArticle.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {currentArticle.excerpt}
          </p>
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {currentArticle.author}
              </div>
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(currentArticle.date).toLocaleDateString()}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Heart className="h-4 w-4 mr-2" />
                Like
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {currentArticle.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Article Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="prose prose-lg max-w-none">
            {currentArticle.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    {paragraph.replace('## ', '')}
                  </h2>
                )
              } else if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                    {paragraph.replace('### ', '')}
                  </h3>
                )
              } else if (paragraph.startsWith('1. ') || paragraph.startsWith('2. ') || paragraph.startsWith('3. ') || paragraph.startsWith('4. ') || paragraph.startsWith('5. ')) {
                return (
                  <li key={index} className="text-gray-700 mb-2">
                    {paragraph}
                  </li>
                )
              } else {
                return (
                  <p key={index} className="text-gray-700 mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                )
              }
            })}
          </div>
        </div>

        {/* Author Bio */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">About the Author</h3>
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-gray-500" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{currentArticle.author}</h4>
              <p className="text-gray-600">
                A licensed mental health professional with expertise in {currentArticle.category.toLowerCase()}. 
                Dedicated to helping individuals improve their mental wellness through evidence-based approaches.
              </p>
            </div>
          </div>
        </div>

        {/* Similar Articles */}
        {similarPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Similar Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similarPosts.map((post) => (
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
                    <CardTitle className="text-lg group-hover:text-[#A66B24] transition-colors">
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
                    <Link href={`/articles/${post.id}`}>
                      <Button variant="ghost" size="sm" className="group-hover:text-[#A66B24]">
                        Read More
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
