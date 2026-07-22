// Mock data for the Additional Services pages (modeled on the EduCtrl demo's
// service-and-visa module). Docs: docs/superpowers/mock-data/adminpage.md.

import { leadStaff } from './leads'

export interface ServiceMessage {
  text: string
  notify: string | null
  files: string[]
  at: string
  by: string
}

export interface ServiceActivity {
  text: string
  at: string
}

export interface ServiceRequest {
  id: number
  dateCreated: string // "10-06-2026"
  status: string // '' = none yet
  studentName: string
  studentEmail: string
  studentPhone: string
  service: string
  country: string
  description: string
  assignedTo: string | null
  notes: string
  messages: ServiceMessage[]
  activity: ServiceActivity[]
}

export const serviceTypes = [
  'Insurance',
  'Work Visa',
  'Visa On Time',
  'Transport Services',
  'Accommodation',
  'Visitor Visa',
  'English Language training',
]

export const serviceStatuses = [
  'New File',
  'Processing',
  'Decision - Completed',
  'Decision - Rejected',
]

export { leadStaff as serviceStaff }

const seedRequests: ServiceRequest[] = [
  { id: 559357, dateCreated: '10-06-2026', status: '', studentName: 'TRETET GDGD', studentEmail: 'hghgh@gmail.com', studentPhone: '+91 99999 99990', service: 'Visa On Time', country: 'Canada', description: 'Voluptas ullam rerum quis, bibendum mollis mauris integer in faucibus.', assignedTo: null, notes: '', messages: [], activity: [] },
  { id: 820610, dateCreated: '17-05-2026', status: '', studentName: 'Manan Parekh', studentEmail: 'manan.parekh@gmail.com', studentPhone: '+91 98800 11223', service: 'Insurance', country: 'Malta', description: '', assignedTo: null, notes: '', messages: [], activity: [] },
  { id: 637180, dateCreated: '12-05-2026', status: '', studentName: 'Manan Parekh', studentEmail: 'manan.parekh@gmail.com', studentPhone: '+91 98800 11223', service: 'Work Visa', country: 'United Arab Emirates', description: 'Ok, Hello. Need this processed before July.', assignedTo: 'Admin Two Test', notes: '', messages: [], activity: [] },
  { id: 901408, dateCreated: '09-05-2026', status: 'Processing', studentName: 'SHEYI KAYODE', studentEmail: 'sheyi.k@gmail.com', studentPhone: '+234 803 555 1212', service: 'Insurance', country: 'Australia', description: 'test insurance request for family cover.', assignedTo: null, notes: '', messages: [], activity: [{ text: 'STATUS CHANGED TO: Processing', at: '09 May 2026, 11:20 AM · Admin Admin' }] },
  { id: 163454, dateCreated: '06-05-2026', status: '', studentName: 'jasp as', studentEmail: 'jasp.as@gmail.com', studentPhone: '+91 90000 12121', service: 'Visitor Visa', country: 'Canada', description: '', assignedTo: null, notes: '', messages: [], activity: [] },
  { id: 934270, dateCreated: '06-05-2026', status: '', studentName: 'Gwendolyn Clay', studentEmail: 'gwen.clay@gmail.com', studentPhone: '+1 415 555 0132', service: 'Visitor Visa', country: 'Canada', description: '', assignedTo: null, notes: '', messages: [], activity: [] },
  { id: 480578, dateCreated: '05-04-2026', status: 'Processing', studentName: 'Manuj Mehta', studentEmail: 'manuj.mehta@gmail.com', studentPhone: '+91 98111 33445', service: 'Visitor Visa', country: 'Australia', description: 'Tourist visa for parents, June travel.', assignedTo: 'Sarah Ali', notes: '', messages: [], activity: [{ text: 'STATUS CHANGED TO: Processing', at: '06 Apr 2026, 2:10 PM · Sarah Ali' }] },
  { id: 712905, dateCreated: '28-03-2026', status: 'New File', studentName: 'Ayesha Khan', studentEmail: 'ayesha.khan@gmail.com', studentPhone: '+92 300 4455667', service: 'Accommodation', country: 'United Kingdom', description: 'Student accommodation near University of Manchester.', assignedTo: 'Mohammed Saleh', notes: '', messages: [], activity: [{ text: 'STATUS CHANGED TO: New File', at: '28 Mar 2026, 9:05 AM · Mohammed Saleh' }] },
  { id: 355126, dateCreated: '15-03-2026', status: 'Decision - Completed', studentName: 'Rohan Das', studentEmail: 'rohan.das@gmail.com', studentPhone: '+91 90080 11223', service: 'English Language training', country: 'Australia', description: 'IELTS coaching package, 8-week batch.', assignedTo: 'Sarah Ali', notes: 'Enrolled in the March batch.', messages: [], activity: [{ text: 'STATUS CHANGED TO: Decision - Completed', at: '20 Mar 2026, 4:45 PM · Sarah Ali' }] },
  { id: 268834, dateCreated: '02-03-2026', status: '', studentName: 'Fatima Rahman', studentEmail: 'fatima.r@gmail.com', studentPhone: '+880 1712 445566', service: 'Transport Services', country: 'Canada', description: 'Airport pickup at Toronto Pearson.', assignedTo: null, notes: '', messages: [], activity: [] },
  { id: 597441, dateCreated: '18-02-2026', status: 'Decision - Rejected', studentName: 'Imran Ali', studentEmail: 'imran.ali@gmail.com', studentPhone: '+92 301 5566778', service: 'Work Visa', country: 'United States', description: 'H-1B alternative consultation.', assignedTo: 'Moses Otieno', notes: 'Ineligible this cycle.', messages: [], activity: [{ text: 'STATUS CHANGED TO: Decision - Rejected', at: '25 Feb 2026, 1:30 PM · Moses Otieno' }] },
  { id: 105263, dateCreated: '04-01-2026', status: '', studentName: 'Priya Nair', studentEmail: 'priya.nair@gmail.com', studentPhone: '+91 90000 11111', service: 'Insurance', country: 'United Kingdom', description: '', assignedTo: null, notes: '', messages: [], activity: [] },
]

const SERVICES_KEY = 'unidest-services'

function loadServices(): ServiceRequest[] {
  try {
    const raw = localStorage.getItem(SERVICES_KEY)
    if (!raw) return seedRequests
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : seedRequests
  } catch {
    return seedRequests
  }
}

export const serviceRequests: ServiceRequest[] = loadServices()

export function saveServices(next: ServiceRequest[]) {
  try {
    localStorage.setItem(SERVICES_KEY, JSON.stringify(next))
  } catch {
    // Storage blocked — changes just won't persist.
  }
}

export function updateService(updated: ServiceRequest) {
  const i = serviceRequests.findIndex((r) => r.id === updated.id)
  if (i >= 0) serviceRequests[i] = updated
  saveServices([...serviceRequests])
}

export function deleteService(id: number) {
  const i = serviceRequests.findIndex((r) => r.id === id)
  if (i >= 0) serviceRequests.splice(i, 1)
  saveServices([...serviceRequests])
}

export const nowStamp = () =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
