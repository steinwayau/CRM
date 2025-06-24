import { z } from "zod"

export const enquirySchema = z.object({
  status: z.string().default("New"),
  institutionName: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  surname: z.string().optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
  nationality: z.string().default("English"),
  state: z.string().min(1, "Please select a state"),
  suburb: z.string().optional(),
  source: z.string().min(1, "Please select where you heard about us"),
  sourceOther: z.string().optional(),
  enquirySource: z.string().min(1, "Please select enquiry source"),
  enquirySourceOther: z.string().optional(),
  products: z.array(z.string()).min(1, "Please select at least one product interest"),
  otherProducts: z.string().optional(),
  comment: z.string().optional(),
  followUpInfo: z.string().optional(),
  followUpDate: z.string().optional(),
  classification: z.string().default("N/A"),
  stepProgram: z.string().default("N/A"),
  involving: z.string().default("No"),
  notInvolvingReason: z.string().optional(),
  newsletter: z.string().default("Yes"),
  callTakenBy: z.string().min(1, "Please select who is submitting this enquiry"),
})

export type EnquiryFormData = z.infer<typeof enquirySchema>

export const filterSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
  state: z.string().optional(),
  nationality: z.string().optional(),
  classification: z.string().optional(),
  callTakenBy: z.string().optional(),
  source: z.string().optional(),
  model: z.string().optional(),
  newsletter: z.string().optional(),
  search: z.string().optional(),
})

export type FilterData = z.infer<typeof filterSchema> 