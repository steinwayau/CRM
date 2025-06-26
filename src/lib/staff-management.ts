// Staff Management System for EPG CRM
// Handles active/inactive staff with proper filtering and labeling

export interface StaffMember {
  name: string
  isActive: boolean
  role?: string
  email?: string
}

// Complete staff database with active/inactive status
export const STAFF_DATABASE: StaffMember[] = [
  // Current/Active Staff (these will appear in customer inquiry form)
  { name: "Administrator", isActive: true, role: "Admin" }, // Admin user for enquiry submissions
  { name: "June", isActive: true, role: "Staff" },
  { name: "Chris", isActive: true, role: "Staff" },
  { name: "Mike", isActive: true, role: "Staff" },
  { name: "Alison", isActive: true, role: "Staff" },
  { name: "Angela", isActive: true, role: "Staff" },
  { name: "Olivia", isActive: true, role: "Staff" },
  { name: "Mark", isActive: true, role: "Staff" },
  { name: "Louie", isActive: true, role: "Staff" },
  { name: "Day", isActive: true, role: "Staff" }, // Restored to active status
  { name: "Hendra", isActive: true, role: "Staff" }, // Re-added to active staff
  
  // Historical/Inactive Staff (for data integrity, appear with "(Former)" label)
  { name: "Abbey Landgren", isActive: false, role: "Former Staff", email: "abbey@epgpianos.com.au" },
  { name: "Alexa Curtis", isActive: false, role: "Former Staff" },
  { name: "Angela Liu", isActive: false, role: "Former Staff" },
  { name: "Daryl", isActive: false, role: "Former Staff" },
  { name: "Jeremy", isActive: false, role: "Former Staff" },
  { name: "Jessica Herz", isActive: false, role: "Former Staff" },
  { name: "Lucy", isActive: false, role: "Former Staff" },
  { name: "Sargoon", isActive: false, role: "Former Staff" },
  { name: "Teresa", isActive: false, role: "Former Staff" },
  { name: "Alison West", isActive: false, role: "Former Staff" },
  { name: "Andrea Idato", isActive: false, role: "Former Staff" },
  { name: "Anthea Wong", isActive: false, role: "Former Staff" },
  { name: "Davina", isActive: false, role: "Former Staff" },
  { name: "Dolly", isActive: false, role: "Former Staff" },
  { name: "Georgie Jennings", isActive: false, role: "Former Staff" },
  { name: "Irina", isActive: false, role: "Former Staff" },
  { name: "Jennie Lu", isActive: false, role: "Former Staff" },
  { name: "Johannes MacDonald", isActive: false, role: "Former Staff" },
  { name: "Josephine Macken", isActive: false, role: "Former Staff" },
  { name: "Jude", isActive: false, role: "Former Staff" },
  { name: "Juliana Zhuang", isActive: false, role: "Former Staff" },
  { name: "Kelly Tsai", isActive: false, role: "Former Staff" },
  { name: "Kevin Wang", isActive: false, role: "Former Staff" },
  { name: "Layla Li", isActive: false, role: "Former Staff" },
  { name: "Lisha Feng", isActive: false, role: "Former Staff" },
  { name: "Meng Dai", isActive: false, role: "Former Staff" },
  { name: "Olivia Huang", isActive: false, role: "Former Staff" },
  { name: "Pat", isActive: false, role: "Former Staff" },
  { name: "Robert", isActive: false, role: "Former Staff" },
  { name: "Yoong Whei Lee", isActive: false, role: "Former Staff" }
]

// Get only active staff for customer inquiry form
export const getActiveStaff = (): string[] => {
  return STAFF_DATABASE
    .filter(staff => staff.isActive)
    .map(staff => staff.name)
    .sort()
}

// Get all staff with proper labeling for follow-up system
export const getAllStaffWithLabels = (): Array<{ value: string; label: string; isActive: boolean }> => {
  const activeStaff = STAFF_DATABASE
    .filter(staff => staff.isActive)
    .map(staff => ({
      value: staff.name,
      label: staff.name,
      isActive: true
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const inactiveStaff = STAFF_DATABASE
    .filter(staff => !staff.isActive)
    .map(staff => ({
      value: staff.name,
      label: `${staff.name} (Former)`,
      isActive: false
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return [...activeStaff, ...inactiveStaff]
}

// Get all staff names for filtering (includes "All" option)
export const getAllStaffForFiltering = (): string[] => {
  return [
    "All",
    ...STAFF_DATABASE.map(staff => staff.name).sort()
  ]
}

// Admin functions (for future admin panel)
export const updateStaffStatus = (staffName: string, isActive: boolean): boolean => {
  const staffIndex = STAFF_DATABASE.findIndex(staff => staff.name === staffName)
  if (staffIndex !== -1) {
    STAFF_DATABASE[staffIndex].isActive = isActive
    return true
  }
  return false
}

export const addNewStaff = (name: string, isActive: boolean = true, role?: string, email?: string): boolean => {
  const exists = STAFF_DATABASE.some(staff => staff.name === name)
  if (!exists) {
    STAFF_DATABASE.push({ name, isActive, role, email })
    return true
  }
  return false
}

export const getStaffMember = (name: string): StaffMember | undefined => {
  return STAFF_DATABASE.find(staff => staff.name === name)
}

// Get staff options for follow-up form based on the enquiry
export const getFollowUpStaffOptions = (originalSubmitter?: string): Array<{ value: string; label: string; isActive: boolean }> => {
  const options: Array<{ value: string; label: string; isActive: boolean }> = []
  
  // Always include all current active staff
  const activeStaff = STAFF_DATABASE
    .filter(staff => staff.isActive)
    .map(staff => ({
      value: staff.name,
      label: staff.name,
      isActive: true
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
  
  options.push(...activeStaff)
  
  // If there's an original submitter and they're not already in the active list, add them
  if (originalSubmitter) {
    const isAlreadyIncluded = options.some(option => option.value === originalSubmitter)
    
    if (!isAlreadyIncluded) {
      const originalStaffMember = STAFF_DATABASE.find(staff => staff.name === originalSubmitter)
      if (originalStaffMember) {
        // It's a former staff member who was the original submitter
        options.unshift({
          value: originalSubmitter,
          label: `${originalSubmitter} (Original Submitter - Former)`,
          isActive: false
        })
      } else {
        // Original submitter is not in our staff database (maybe "Online Form" or external)
        options.unshift({
          value: originalSubmitter,
          label: `${originalSubmitter} (Original Submitter)`,
          isActive: false
        })
      }
    }
  }
  
  return options
} 