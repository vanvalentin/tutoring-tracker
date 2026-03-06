export const STORAGE_KEYS = {
  STUDENTS: 'tutoring-students',
  FEES: 'tutoring-fees',
  LESSONS: 'tutoring-lessons',
  TRANSPORTATION: 'tutoring-transportation',
  MATERIAL: 'tutoring-material',
}

export const DEFAULT_STUDENTS = [
  { id: '1', name: 'Michelle Lee', location: 'Mid-Levels', address: 'Flat 1A, 25 Caine Rd', goal: 'IELTS Speaking', paymentMethod: 'FPS', notes: '', active: true },
  { id: '2', name: 'Kenji Wong', location: 'Kwun Tong', address: 'Unit 8B, Millennium City 6', goal: 'Business English', paymentMethod: 'PayMe', notes: '', active: true },
  { id: '3', name: 'Sophia Chan', location: 'Tsim Sha Tsui', address: 'G/F, 18 Nathan Rd', goal: 'Academic Writing', paymentMethod: 'FPS', notes: '', active: true },
  { id: '4', name: 'David Ip', location: 'Sheung Wan', address: "4/F, 7 Des Voeux Rd West", goal: 'Conversational Fluency', paymentMethod: 'PayMe', notes: '', active: true },
  { id: '5', name: 'Jenny Lau', location: 'Sha Tin', address: 'House 5, Royal Ascot', goal: 'TOEFL Preparation', paymentMethod: 'FPS', notes: '', active: false },
  { id: '6', name: 'Peter Ng', location: 'Central', address: "Suite 1201, 9 Queen's Rd", goal: 'Legal English', paymentMethod: 'PayMe', notes: '', active: true },
]

export const DEFAULT_FEES = [
  { id: '1', duration: '1.0 hour', fee: 360, description: 'Standard Private Lesson' },
  { id: '2', duration: '1.5 hours', fee: 520, description: 'Extended Private Lesson' },
  { id: '3', duration: '2.0 hours', fee: 690, description: 'Intensive Private Lesson' },
]

// HK districts (18) + common areas
export const LOCATIONS = [
  // Hong Kong Island districts
  'Central and Western',
  'Eastern',
  'Southern',
  'Wan Chai',
  // Kowloon districts
  'Kowloon City',
  'Kwun Tong',
  'Sham Shui Po',
  'Wong Tai Sin',
  'Yau Tsim Mong',
  // New Territories districts
  'Islands',
  'Kwai Tsing',
  'North',
  'Sai Kung',
  'Sha Tin',
  'Tai Po',
  'Tsuen Wan',
  'Tuen Mun',
  'Yuen Long',
  // Hong Kong Island areas
  'Aberdeen',
  'Admiralty',
  'Causeway Bay',
  'Central',
  'Chai Wan',
  'Happy Valley',
  'Kennedy Town',
  'Mid-Levels',
  'North Point',
  'Pok Fu Lam',
  'Quarry Bay',
  'Sai Ying Pun',
  'Sheung Wan',
  'Shau Kei Wan',
  'Stanley',
  'Tai Koo',
  // Kowloon areas
  'Cheung Sha Wan',
  'Ho Man Tin',
  'Jordan',
  'Kowloon Bay',
  'Kowloon Tong',
  'Lai Chi Kok',
  'Lam Tin',
  'Mei Foo',
  'Mong Kok',
  'Ngau Tau Kok',
  'Tai Kok Tsui',
  'To Kwa Wan',
  'Tsim Sha Tsui',
  'Yau Ma Tei',
  // New Territories areas
  'Discovery Bay',
  'Fanling',
  'Ma On Shan',
  'Tung Chung',
]
export const GOALS = ['IELTS Speaking', 'Business English', 'Academic Writing', 'Conversational Fluency', 'TOEFL Preparation', 'Legal English']
export const PAYMENT_METHODS = ['FPS', 'PayMe', 'Bank Transfer', 'Cash']
export const TRANSPORT_TYPES = ['MTR', 'Taxi', 'Bus', 'Other']

export function generateId() {
  return crypto.randomUUID()
}
