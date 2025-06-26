export function getNextFriday(date: Date = new Date()): Date {
  const nextFriday = new Date(date)
  const daysUntilFriday = (5 - date.getDay() + 7) % 7
  if (daysUntilFriday === 0 && date.getDay() === 5) {
    nextFriday.setDate(date.getDate() + 7)
  } else {
    nextFriday.setDate(date.getDate() + daysUntilFriday)
  }
  nextFriday.setHours(8, 0, 0, 0) // 8:00 AM
  return nextFriday
}

export function calculateLiveTill(liveFrom: Date): Date {
  const liveTill = new Date(liveFrom)
  liveTill.setDate(liveFrom.getDate() + 6) // Next Thursday
  liveTill.setHours(9, 59, 0, 0) // 9:59 AM
  return liveTill
}

export function calculateResultDate(liveFrom: Date): Date {
  const resultDate = new Date(liveFrom)
  resultDate.setDate(liveFrom.getDate() + 6) // Next Thursday
  resultDate.setHours(10, 0, 0, 0) // 10:00 AM
  return resultDate
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export interface Quiz {
  liveFrom: Date
  liveTill: Date
  status: "scheduled" | "live" | "completed" | "draft"
}

export function getQuizStatus(quiz: Quiz): Quiz["status"] {
  const now = new Date()
  if (now < quiz.liveFrom) return "scheduled"
  if (now >= quiz.liveFrom && now < quiz.liveTill) return "live"
  if (now >= quiz.liveTill) return "completed"
  return "draft"
}

export function canEditOrDelete(liveFrom: Date): boolean {
  const now = new Date()
  const cutoffTime = new Date(liveFrom)
  cutoffTime.setDate(liveFrom.getDate() - 1) // Previous day
  cutoffTime.setHours(20, 0, 0, 0) // 8:00 PM
  return now < cutoffTime
}

export function generateQuizTitle(index: number): string {
  const titles = [
    "General Knowledge Quiz",
    "Science & Technology Quiz",
    "History & Geography Quiz",
    "Sports & Entertainment Quiz",
    "Literature & Arts Quiz",
    "Food & Culture Quiz",
    "Current Affairs Quiz",
    "Movies & Music Quiz",
    "Nature & Wildlife Quiz",
    "Business & Economics Quiz",
  ]
  return `${titles[index % titles.length]} #${Math.floor(index / titles.length) + 1}`
}
