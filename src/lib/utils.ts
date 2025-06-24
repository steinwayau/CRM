import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string | null) {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleDateString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatDateTime(date: Date | string | null) {
  if (!date) return ""
  const d = new Date(date)
  return d.toLocaleString("en-AU", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export const states = [
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NSW", label: "New South Wales" },
  { value: "NT", label: "Northern Territory" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "VIC", label: "Victoria" },
  { value: "WA", label: "Western Australia" },
]

export const nationalities = [
  { value: "English", label: "English" },
  { value: "Chinese", label: "Chinese" },
  { value: "Korean", label: "Korean" },
  { value: "Japanese", label: "Japanese" },
  { value: "Indian", label: "Indian" },
  { value: "Other", label: "Other" },
]

export const productOptions = [
  { value: "Steinway", label: "Steinway" },
  { value: "Boston", label: "Boston" },
  { value: "Essex", label: "Essex" },
  { value: "Kawai", label: "Kawai" },
  { value: "Yamaha", label: "Yamaha" },
  { value: "Used Piano", label: "Used Piano" },
  { value: "Roland", label: "Roland" },
  { value: "Ritmuller", label: "Ritmuller" },
  { value: "Ronisch", label: "Ronisch" },
  { value: "Kurzweil", label: "Kurzweil" },
  { value: "Other", label: "Other" },
]

export const sourceOptions = [
  { value: "Teacher", label: "Teacher" },
  { value: "Google", label: "Google" },
  { value: "Facebook", label: "Facebook" },
  { value: "Instagram", label: "Instagram" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "WeChat", label: "WeChat" },
  { value: "Xiaohongshu", label: "Xiaohongshu" },
  { value: "YouTube", label: "YouTube" },
  { value: "Steinway Website", label: "Steinway Website" },
  { value: "Radio", label: "Radio" },
  { value: "Magazine/Newspaper", label: "Magazine/Newspaper" },
  { value: "Recommended by a friend", label: "Recommended by a friend" },
  { value: "Event Follow Up", label: "Event Follow Up" },
  { value: "Walked Past - Steinway Gallery Melbourne", label: "Walked Past - Steinway Gallery Melbourne" },
  { value: "Walked Past - Steinway Gallery Sydney", label: "Walked Past - Steinway Gallery Sydney" },
  { value: "Walked Past - Steinway Piano Showroom Sanctuary Cove", label: "Walked Past - Steinway Piano Showroom Sanctuary Cove" },
  { value: "Email Blast", label: "Email Blast" },
  { value: "Institutional / Corporate Canvasing", label: "Institutional / Corporate Canvasing" },
  { value: "Other", label: "Other" },
]

export const staffOptions = [
  { value: "Abbey Landgren", label: "Abbey Landgren" },
  { value: "Alexa Curtis", label: "Alexa Curtis" },
  { value: "Alison West", label: "Alison West" },
  { value: "Andrea Idato", label: "Andrea Idato" },
  { value: "Angela Liu", label: "Angela Liu" },
  { value: "Anthea Wong", label: "Anthea Wong" },
  { value: "Chris", label: "Chris" },
  { value: "Day Peng", label: "Day Peng" },
  { value: "Daryl", label: "Daryl" },
  { value: "Davina", label: "Davina" },
  { value: "Dolly", label: "Dolly" },
  { value: "Georgie Jennings", label: "Georgie Jennings" },
  { value: "Irina", label: "Irina" },
  { value: "Jennie Liu", label: "Jennie Liu" },
  { value: "Jeremy", label: "Jeremy" },
  { value: "Jessica Herz", label: "Jessica Herz" },
  { value: "Johannes MacDonald", label: "Johannes MacDonald" },
  { value: "Josephine Macken", label: "Josephine Macken" },
  { value: "Jude", label: "Jude" },
  { value: "Juliana Zhuang", label: "Juliana Zhuang" },
  { value: "June", label: "June" },
  { value: "Kelly Tsai", label: "Kelly Tsai" },
  { value: "Kevin Wang", label: "Kevin Wang" },
  { value: "Layla Li", label: "Layla Li" },
  { value: "Lisha Feng", label: "Lisha Feng" },
  { value: "Lucy", label: "Lucy" },
  { value: "Mark", label: "Mark" },
  { value: "Meng Dai", label: "Meng Dai" },
  { value: "Mike", label: "Mike" },
  { value: "Olivia Huang", label: "Olivia Huang" },
  { value: "Pat", label: "Pat" },
  { value: "Robert", label: "Robert" },
  { value: "Sargoon", label: "Sargoon" },
  { value: "Teresa", label: "Teresa" },
  { value: "Yoong Whei Lee", label: "Yoong Whei Lee" },
] 