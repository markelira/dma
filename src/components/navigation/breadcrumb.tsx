'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Breadcrumb as UiBreadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

interface AppBreadcrumbProps {
  className?: string
  // We can add more props for custom mappings later
}

export function AppBreadcrumb({ className }: AppBreadcrumbProps) {
  const pathname = usePathname()
  const pathSegments = pathname?.split('/')?.filter(Boolean) || []

  if (pathSegments.length === 0) {
    return null // Don't show on root page
  }

  return (
    <UiBreadcrumb className={cn('mb-4', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Főoldal</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/')
          const isLast = index === pathSegments.length - 1
          const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </UiBreadcrumb>
  )
} 