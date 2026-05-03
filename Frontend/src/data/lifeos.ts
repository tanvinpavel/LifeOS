import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
  ClipboardList,
  Flame,
  HeartPulse,
  Home,
  LayoutDashboard,
  LineChart,
  ListChecks,
  LucideIcon,
  Moon,
  NotebookPen,
  Sparkles,
  Target,
  UserRoundCog,
  Zap,
} from "lucide-react"

export type ViewId =
  | "dashboard"
  | "checkin"
  | "habits"
  | "goals"
  | "analytics"
  | "calendar"
  | "journal"
  | "notifications"
  | "settings"

export type NavItem = {
  id: ViewId
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "checkin", label: "Check-in", icon: Sparkles },
  { id: "habits", label: "Habits", icon: ListChecks },
  { id: "goals", label: "Goals", icon: Target },
  { id: "analytics", label: "Analytics", icon: LineChart },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "journal", label: "Journal", icon: NotebookPen },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "settings", label: "Settings", icon: UserRoundCog },
]

export const kpis = [
  { label: "Today complete", value: "78%", delta: "+12%", icon: CheckCircle2, tone: "emerald" },
  { label: "Weekly score", value: "84", delta: "green", icon: CircleGauge, tone: "sky" },
  { label: "Current streak", value: "19d", delta: "+3 days", icon: Flame, tone: "rose" },
  { label: "Focus hours", value: "5.8", delta: "+0.7h", icon: Zap, tone: "amber" },
]

export const todayHabits = [
  { name: "Morning workout", category: "Health", done: true, streak: 12, color: "bg-emerald-500" },
  { name: "Deep work block", category: "Work", done: true, streak: 19, color: "bg-sky-500" },
  { name: "Read 20 pages", category: "Mind", done: false, streak: 6, color: "bg-violet-500" },
  { name: "Evening reflection", category: "Personal", done: false, streak: 9, color: "bg-amber-500" },
]

export const tasks = [
  { title: "Draft weekly review", goal: "Consistency system", priority: "High", status: "In progress" },
  { title: "Plan client sprint", goal: "Career momentum", priority: "High", status: "Todo" },
  { title: "Book health checkup", goal: "Health baseline", priority: "Medium", status: "Todo" },
  { title: "Clean finance notes", goal: "Money clarity", priority: "Low", status: "Done" },
]

export const goals = [
  { title: "Ship portfolio case study", progress: 68, due: "May 12", area: "Work" },
  { title: "Run 60 km this month", progress: 42, due: "May 30", area: "Health" },
  { title: "Read 4 books", progress: 75, due: "Jun 01", area: "Mind" },
]

export const trendData = [
  { day: "Thu", mood: 3.4, productivity: 4.1, habits: 65 },
  { day: "Fri", mood: 3.8, productivity: 3.6, habits: 70 },
  { day: "Sat", mood: 4.3, productivity: 3.1, habits: 52 },
  { day: "Sun", mood: 3.6, productivity: 3.8, habits: 74 },
  { day: "Mon", mood: 4.2, productivity: 4.4, habits: 82 },
  { day: "Tue", mood: 4.0, productivity: 4.6, habits: 86 },
  { day: "Wed", mood: 4.5, productivity: 4.7, habits: 91 },
]

export const lifeAreas = [
  { area: "Work", value: 82, icon: Home },
  { area: "Health", value: 76, icon: HeartPulse },
  { area: "Mind", value: 69, icon: Moon },
  { area: "Relationships", value: 58, icon: Sparkles },
  { area: "Finance", value: 64, icon: BarChart3 },
  { area: "Spiritual", value: 71, icon: Flame },
]

export const distractions = [
  { name: "Phone scrolling", count: 14, impact: "High" },
  { name: "Context switching", count: 9, impact: "Medium" },
  { name: "Late sleep", count: 5, impact: "Medium" },
]

export const weeklyInsights = [
  "Energy rose 18% on days with a morning workout.",
  "Phone distraction clustered after 10 PM on low-sleep days.",
  "Work and health are improving; relationships need a planned touchpoint.",
]

export const calendarDays = Array.from({ length: 35 }, (_, index) => {
  const completed = [92, 76, 64, 88, 58, 72, 84][index % 7]
  return {
    day: index + 1,
    mood: ["Good", "Calm", "Low", "Great", "OK"][index % 5],
    completed,
  }
})

export const notifications = [
  { title: "Daily check-in", time: "8:30 PM", enabled: true },
  { title: "Habit reminders", time: "7:00 AM", enabled: true },
  { title: "Weekly review", time: "Friday 6:00 PM", enabled: true },
  { title: "Goal deadlines", time: "1 day before", enabled: false },
]

export const adminMetrics = [
  { label: "Active users", value: "1,284", change: "+8.4%" },
  { label: "Check-ins today", value: "812", change: "+12.1%" },
  { label: "Weekly reviews", value: "438", change: "+6.9%" },
  { label: "Failed logins", value: "17", change: "-3.2%" },
]

export const habitCategories = ["Health", "Mind", "Work", "Learning", "Spiritual", "Personal"]

export const moodOptions = ["Calm", "Driven", "Light", "Tired", "Scattered"]

export const areaSummary = [
  { name: "Most improved", value: "Health", note: "+14% from last week" },
  { name: "Needs care", value: "Relationships", note: "2 missed touchpoints" },
  { name: "Best streak", value: "Deep work", note: "19 days active" },
]

export const reportRows = [
  { metric: "Mood average", week: "4.1", previous: "3.7" },
  { metric: "Productivity", week: "4.3", previous: "3.8" },
  { metric: "Habit completion", week: "82%", previous: "74%" },
  { metric: "Distractions", week: "28", previous: "35" },
]

export const quickActions = [
  "Start check-in",
  "Mark habit",
  "Add distraction",
  "Create task",
  "Open review",
]

export const focusPlan = [
  { label: "Today", text: "Finish one deep work block before checking social feeds." },
  { label: "This week", text: "Schedule two relationship touchpoints and protect sleep." },
  { label: "Next review", text: "Compare phone triggers against energy and bedtime." },
]

export const journalPrompts = [
  "What gave me energy today?",
  "What pattern should I interrupt tomorrow?",
  "What is one small win I can repeat?",
]

export const timeline = [
  { time: "07:20", title: "Workout complete", icon: HeartPulse },
  { time: "09:00", title: "Deep work started", icon: Zap },
  { time: "13:40", title: "Phone distraction logged", icon: Bell },
  { time: "20:30", title: "Reflection reminder", icon: ClipboardList },
]
