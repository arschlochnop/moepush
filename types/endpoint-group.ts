import { Endpoint } from "@/lib/db/schema/endpoints"

export interface EndpointGroup {
  id: string
  name: string
  userId: string
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
}

export interface EndpointGroupWithEndpoints extends EndpointGroup {
  endpointIds: string[]
  endpoints: Endpoint[]
} 