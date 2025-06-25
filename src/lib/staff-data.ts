// Staff credentials management utility
// Temporary staff storage (replace with database in production)
let staffCredentials = [
  { id: 1, username: 'june.staff', password: 'Jun3@2025!', name: 'June', role: 'staff', active: true },
  { id: 2, username: 'chris.staff', password: 'Chr1s@2025!', name: 'Chris', role: 'staff', active: true },
  { id: 3, username: 'mike.staff', password: 'M1ke@2025!', name: 'Mike', role: 'staff', active: true },
  { id: 4, username: 'alison.staff', password: 'Al1s0n@2025!', name: 'Alison', role: 'staff', active: true },
  { id: 5, username: 'angela.staff', password: 'Ang3la@2025!', name: 'Angela', role: 'staff', active: true },
  { id: 6, username: 'olivia.staff', password: 'Ol1v1a@2025!', name: 'Olivia', role: 'staff', active: true },
  { id: 7, username: 'mark.staff', password: 'M@rk2025!', name: 'Mark', role: 'staff', active: true },
  { id: 8, username: 'louie.staff', password: 'L0u1e@2025!', name: 'Louie', role: 'staff', active: true },
  { id: 9, username: 'day.staff', password: 'D@y2025!', name: 'Day', role: 'staff', active: true },
  { id: 10, username: 'hendra.staff', password: 'H3ndr@2025!', name: 'Hendra', role: 'staff', active: true }
]

export function getStaffCredentials() {
  return staffCredentials
}

export function updateStaffCredentials(newCredentials: any[]) {
  staffCredentials = newCredentials
} 