import { createQueryClientWithErrorHandling } from "./queryErrorHandler"

export function createQueryClient() {
  return createQueryClientWithErrorHandling()
} 