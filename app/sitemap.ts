import { MetadataRoute } from 'next'

// ADD THESE TWO LINES HERE:
export const dynamic = 'force-static'
export const revalidate = false 

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://moviesvaultdb.web.app"; // Use your actual firebase URL

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    { 
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]
}