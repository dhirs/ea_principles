'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Section {
  id: string
  title: string
  description?: string
  content: any
  type: 'list' | 'grid' | 'text' | 'accordion'
  metadata?: Record<string, any>
}

interface JsonData {
  title: string
  description?: string
  sections: Section[]
  metadata?: Record<string, any>
}

export default function Home() {
  const [data, setData] = useState<JsonData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data')
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`)
        }
        
        const jsonData = await response.json()
        setData(jsonData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error Loading Data</CardTitle>
            <CardDescription className="text-red-600">{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>The JSON file appears to be empty.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {data.title || 'Data Viewer'}
          </h1>
          {data.description && (
            <p className="text-gray-600 text-lg">{data.description}</p>
          )}
        </div>

        {data.sections && data.sections.length > 1 ? (
          <Tabs defaultValue={data.sections[0].id || '0'} className="w-full">
            <TabsList className="grid w-full grid-cols-auto gap-2 h-auto p-1" style={{gridTemplateColumns: `repeat(${Math.min(data.sections.length, 5)}, minmax(0, 1fr))`}}>
              {data.sections.map((section, index) => (
                <TabsTrigger key={section.id || index} value={section.id || String(index)} className="data-[state=active]:bg-white">
                  {section.title || `Section ${index + 1}`}
                </TabsTrigger>
              ))}
            </TabsList>
            {data.sections.map((section, index) => (
              <TabsContent key={section.id || index} value={section.id || String(index)} className="mt-6">
                <SectionRenderer section={section} />
              </TabsContent>
            ))}
          </Tabs>
        ) : data.sections ? (
          data.sections.map((section, index) => (
            <SectionRenderer key={section.id || index} section={section} />
          ))
        ) : (
          <Card>
            <CardContent className="pt-6">
              <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function SectionRenderer({ section }: { section: any }) {
  const renderContent = (content: any) => {
    if (Array.isArray(content)) {
      if (section.type === 'accordion') {
        return (
          <Accordion className="w-full">
            {content.map((item: any, index: number) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.title || item.name || `Item ${index + 1}`}</AccordionTrigger>
                <AccordionContent>
                  <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )
      } else if (section.type === 'grid') {
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.map((item: any, index: number) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.title || item.name || `Item ${index + 1}`}</CardTitle>
                  {item.category && <Badge variant="secondary">{item.category}</Badge>}
                </CardHeader>
                <CardContent>
                  <pre className="text-sm bg-gray-50 p-3 rounded overflow-auto max-h-40">
                    {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      } else {
        return (
          <div className="space-y-3">
            {content.map((item: any, index: number) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="font-medium mb-1">{item.title || item.name || `Item ${index + 1}`}</div>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {typeof item === 'object' ? JSON.stringify(item, null, 2) : item}
                </pre>
              </div>
            ))}
          </div>
        )
      }
    } else if (typeof content === 'object') {
      return (
        <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      )
    } else {
      return <p className="text-gray-700 leading-relaxed">{content}</p>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{section.title || 'Section'}</CardTitle>
        {section.description && <CardDescription>{section.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {renderContent(section.content || section)}
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-12 px-4">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-6 w-96 mb-8" />
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}