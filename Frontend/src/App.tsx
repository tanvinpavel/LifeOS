import { FormEvent, useEffect, useState, type ReactNode } from "react"
import { Navigate, Route, Routes, useLocation, useNavigate, type Location } from "react-router-dom"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Bell,
  CalendarCheck,
  Check,
  Clock3,
  Download,
  Flame,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  calendarDays,
  focusPlan,
  habitCategories,
  journalPrompts,
  navItems,
  reportRows,
  trendData,
  type ViewId,
} from "@/data/lifeos"
import { API_BASE_URL, ApiError, api } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { cn } from "@/lib/utils"

type Habit = {
  id: string
  title: string
  category: string
  is_active?: boolean
  why?: string
  cue?: string
  routine?: string
  reward?: string
  start_date?: string
  end_date?: string
  duration_days?: number
  phases?: HabitPhase[]
}

type HabitPhase = {
  title: string
  start_day: number
  end_day: number
  focus: string
}

type HabitLog = {
  id?: string
  habit_id: string
  date: string
  status: boolean
}

type HabitAnalytics = {
  name: string
  area: string
  start: string
  end: string
  day: number
  duration: number
  checked: number
  elapsed: number
  currentPhase: string
  insight: string
  heatmap: string
  phases: {
    name: string
    title?: string
    completed: number
    total: number
    elapsed?: number
    percent?: number
  }[]
}

type Goal = {
  id: string
  title: string
  area: string
  due: string
  progress: number
  status: string
}

type Task = {
  id: string
  title: string
  goal: string
  priority: "High" | "Medium" | "Low"
  done: boolean
}

type JournalNote = {
  id: string
  title: string
  body: string
  win: string
  lesson: string
  createdAt: string
}

type Reminder = {
  id: string
  title: string
  time: string
  enabled: boolean
  read?: boolean
}

type DailyState = {
  id?: string
  date: string
  energy_level?: "low" | "medium" | "high"
  mood?: "happy" | "neutral" | "sad" | "angry" | "stressed"
  self_rating?: number
  note?: string
}

const viewRoutes: Record<ViewId, string> = {
  dashboard: "/",
  checkin: "/check-in",
  habits: "/habits",
  goals: "/goals",
  analytics: "/analytics",
  calendar: "/calendar",
  journal: "/journal",
  notifications: "/notifications",
  settings: "/settings",
}

const routeViews = Object.entries(viewRoutes).reduce<Record<string, ViewId>>((acc, [view, path]) => {
  acc[path] = view as ViewId
  return acc
}, {})
routeViews["/dashboard"] = "dashboard"

const todayIso = new Date().toISOString().slice(0, 10)

const defaultGoals: Goal[] = [
  { id: "g1", title: "Ship portfolio case study", area: "Work", due: "2026-05-12", progress: 68, status: "Active" },
  { id: "g2", title: "Run 60 km this month", area: "Health", due: "2026-05-30", progress: 42, status: "Active" },
  { id: "g3", title: "Read 4 books", area: "Mind", due: "2026-06-01", progress: 75, status: "Active" },
]

const defaultTasks: Task[] = [
  { id: "t1", title: "Draft weekly review", goal: "Consistency system", priority: "High", done: false },
  { id: "t2", title: "Plan client sprint", goal: "Career momentum", priority: "High", done: false },
  { id: "t3", title: "Book health checkup", goal: "Health baseline", priority: "Medium", done: false },
]

const defaultReminders: Reminder[] = [
  { id: "n1", title: "Daily check-in", time: "8:30 PM", enabled: true },
  { id: "n2", title: "Habit reminders", time: "7:00 AM", enabled: true },
  { id: "n3", title: "Weekly review", time: "Friday 6:00 PM", enabled: true },
  { id: "n4", title: "Goal deadlines", time: "1 day before", enabled: false },
]

const fallbackHabitAnalytics: HabitAnalytics[] = [
  {
    name: "Read for 20 minutes",
    area: "Mind",
    start: "2026-05-03",
    end: "2026-07-07",
    day: 18,
    duration: 66,
    checked: 15,
    elapsed: 18,
    currentPhase: "Install",
    insight: "Strong start. Protect the evening cue.",
    heatmap: "111101101111011101000000000000000000000000000000000000000000000000",
    phases: [
      { name: "Design", completed: 6, total: 7 },
      { name: "Install", completed: 9, total: 11 },
      { name: "Stabilize", completed: 0, total: 24 },
      { name: "Identity", completed: 0, total: 24 },
    ],
  },
  {
    name: "Morning walk",
    area: "Health",
    start: "2026-04-20",
    end: "2026-06-24",
    day: 31,
    duration: 66,
    checked: 22,
    elapsed: 31,
    currentPhase: "Stabilize",
    insight: "Weekends are the weak point.",
    heatmap: "111110011111001111100111110011100000000000000000000000000000000000",
    phases: [
      { name: "Design", completed: 7, total: 7 },
      { name: "Install", completed: 11, total: 14 },
      { name: "Stabilize", completed: 4, total: 10 },
      { name: "Identity", completed: 0, total: 35 },
    ],
  },
  {
    name: "Ship one focused block",
    area: "Work",
    start: "2026-05-01",
    end: "2026-07-05",
    day: 20,
    duration: 66,
    checked: 12,
    elapsed: 20,
    currentPhase: "Install",
    insight: "Consistency dips after high-meeting days.",
    heatmap: "110101111001101011010000000000000000000000000000000000000000000000",
    phases: [
      { name: "Design", completed: 5, total: 7 },
      { name: "Install", completed: 7, total: 13 },
      { name: "Stabilize", completed: 0, total: 24 },
      { name: "Identity", completed: 0, total: 22 },
    ],
  },
]

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="/*" element={<ProtectedApp />} />
    </Routes>
  )
}

function ProtectedApp() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [habits, setHabits] = useLocalStorage<Habit[]>("lifeos_habits_cache", [])
  const [habitDate, setHabitDate] = useState(todayIso)
  const [habitDone, setHabitDone] = useLocalStorage<Record<string, boolean>>(`lifeos_habit_done_${habitDate}`, {})
  const [goals, setGoals] = useLocalStorage<Goal[]>("lifeos_goals", defaultGoals)
  const [tasks, setTasks] = useLocalStorage<Task[]>("lifeos_tasks", defaultTasks)
  const [notes, setNotes] = useLocalStorage<JournalNote[]>("lifeos_journal", [])
  const [reminders, setReminders] = useLocalStorage<Reminder[]>("lifeos_reminders", defaultReminders)
  const [dailyState, setDailyState] = useLocalStorage<DailyState | null>(`lifeos_daily_${todayIso}`, null)
  const [toast, setToast] = useState("")
  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/"
  const activeView = routeViews[normalizedPath]
  const activeLabel = navItems.find((item) => item.id === activeView)?.label ?? "Dashboard"

  useEffect(() => {
    if (!isAuthenticated) return

    api.habits
      .list()
      .then((data) => {
        const loaded = asArray(data).map((item) => normalizeHabit(item)).filter(Boolean) as Habit[]
        setHabits((cached) => loaded.map((habit) => ({ ...cached.find((item) => item.id === habit.id), ...habit })))
      })
      .catch(() => setToast("Backend habits could not be loaded. Using saved local data."))

    api.dailyState
      .getByDate(todayIso)
      .then((data) => setDailyState(normalizeDailyState(data)))
      .catch(() => undefined)
  }, [isAuthenticated, setDailyState, setHabits])

  useEffect(() => {
    if (!isAuthenticated) return

    api.habits
      .logs(habitDate)
      .then((data) => {
        const done = asArray(data)
          .map((item) => normalizeHabitLog(item))
          .filter(Boolean)
          .reduce<Record<string, boolean>>((acc, item) => {
            if (item) acc[item.habit_id] = item.status
            return acc
          }, {})
        setHabitDone(done)
      })
      .catch(() => undefined)
  }, [habitDate, isAuthenticated, setHabitDone])

  if (isLoading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (!activeView) return <Navigate to="/" replace />

  const navigateTo = (view: ViewId) => navigate(viewRoutes[view])
  const completedHabits = habits.filter((habit) => habitDone[habit.id]).length
  const completion = habits.length ? Math.round((completedHabits / habits.length) * 100) : 0

  return (
    <div className="min-h-screen surface-grid">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 border-r bg-white/95 shadow-soft transition-transform lg:sticky lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar activeView={activeView} onSelect={navigateTo} onClose={() => setSidebarOpen(false)} />
        </aside>
        {sidebarOpen ? (
          <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        ) : null}
        <main className="min-w-0 flex-1">
          <Topbar activeLabel={activeLabel} unread={reminders.filter((item) => !item.read).length} onMenu={() => setSidebarOpen(true)} />
          <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 lg:px-8">
            {toast ? <Toast message={toast} onClose={() => setToast("")} /> : null}
            {activeView === "dashboard" && (
              <DashboardView
                completion={completion}
                habits={habits}
                habitDone={habitDone}
                goals={goals}
                tasks={tasks}
                dailyState={dailyState}
                onNavigate={navigateTo}
              />
            )}
            {activeView === "checkin" && <CheckinView value={dailyState} onSaved={setDailyState} />}
            {activeView === "habits" && (
              <HabitsView
                habits={habits}
                setHabits={setHabits}
                habitDate={habitDate}
                setHabitDate={setHabitDate}
                habitDone={habitDone}
                setHabitDone={setHabitDone}
              />
            )}
            {activeView === "goals" && <GoalsView goals={goals} setGoals={setGoals} tasks={tasks} setTasks={setTasks} />}
            {activeView === "analytics" && <AnalyticsView completion={completion} />}
            {activeView === "calendar" && <CalendarView />}
            {activeView === "journal" && <JournalView notes={notes} setNotes={setNotes} />}
            {activeView === "notifications" && <NotificationsView reminders={reminders} setReminders={setReminders} />}
            {activeView === "settings" && <SettingsView reminders={reminders} setReminders={setReminders} />}
          </div>
        </main>
      </div>
    </div>
  )
}

function Sidebar({
  activeView,
  onSelect,
  onClose,
}: {
  activeView: ViewId
  onSelect: (view: ViewId) => void
  onClose: () => void
}) {
  const { user } = useAuth()
  const displayName = user?.full_name ?? user?.name ?? "LifeOS User"
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-white shadow-lg shadow-teal-600/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-normal">LifeOS</p>
            <p className="text-xs font-medium text-muted-foreground">Track. Plan. Review.</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose} aria-label="Close menu">
          <X />
        </Button>
      </div>
      <div className="px-3">
        <div className="rounded-lg border bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelect(item.id)
                onClose()
              }}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors",
                active ? "bg-teal-600 text-white shadow-md shadow-teal-600/20" : "text-slate-600 hover:bg-slate-100",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="border-t p-4">
        <Button variant="outline" className="w-full justify-start" onClick={() => onSelect("analytics")}>
          <Flame />
          Open weekly review
        </Button>
      </div>
    </div>
  )
}

function Topbar({ activeLabel, unread, onMenu }: { activeLabel: string; unread: number; onMenu: () => void }) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-20 border-b bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">Personal operating system</p>
          <h1 className="truncate text-xl font-bold tracking-normal sm:text-2xl">{activeLabel}</h1>
        </div>
        <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border bg-white px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search notes, habits, goals..." />
        </div>
        <Button variant="outline" size="icon" aria-label="Notifications" onClick={() => navigate("/notifications")} className="relative">
          <Bell />
          {unread ? <span className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-red-600 px-1 text-[10px] text-white">{unread}</span> : null}
        </Button>
        <Button variant="outline" size="icon" aria-label="Settings" onClick={() => navigate("/settings")}>
          <Settings2 />
        </Button>
      </div>
    </header>
  )
}

function DashboardView({
  completion,
  habits,
  habitDone,
  goals,
  tasks,
  dailyState,
  onNavigate,
}: {
  completion: number
  habits: Habit[]
  habitDone: Record<string, boolean>
  goals: Goal[]
  tasks: Task[]
  dailyState: DailyState | null
  onNavigate: (view: ViewId) => void
}) {
  const { user } = useAuth()
  const name = user?.full_name?.split(" ")[0] ?? "there"
  const dashboardKpis = [
    { label: "Today complete", value: `${completion}%`, delta: "habit rate", icon: Check },
    { label: "Weekly score", value: "84", delta: "green", icon: Sparkles },
    { label: "Current streak", value: "19d", delta: "+3 days", icon: Flame },
    { label: "Focus hours", value: "5.8", delta: "+0.7h", icon: Zap },
  ]

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-lg border bg-slate-950 text-white shadow-soft">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.35fr_0.65fr] lg:p-7">
          <div>
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">{todayIso}</Badge>
            <h2 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-normal sm:text-5xl">
              Good evening, {name}. Your day is {completion}% complete.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              {dailyState ? `Mood: ${dailyState.mood}. Rating: ${dailyState.self_rating ?? "not set"}/5.` : "Start today's check-in to sync your state with the dashboard."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="bg-teal-500 text-white hover:bg-teal-400" onClick={() => onNavigate("checkin")}>
                <Sparkles />
                Start check-in
              </Button>
              <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => onNavigate("journal")}>
                <Plus />
                Add quick note
              </Button>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/8 p-4">
            <p className="text-sm font-semibold text-slate-200">Focus plan</p>
            <div className="mt-4 space-y-3">
              {focusPlan.map((item) => (
                <div key={item.label} className="rounded-md bg-white/8 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-100">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-700">
                  <Icon />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <span className="pb-1 text-xs font-semibold text-emerald-600">{kpi.delta}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <TrendCard />
        <Card>
          <CardHeader>
            <CardTitle>Today's habits</CardTitle>
            <CardDescription>{habits.length || 0} active habits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {habits.slice(0, 5).map((habit) => (
              <div key={habit.id} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-semibold">{habit.title}</span>
                <Badge variant={habitDone[habit.id] ? "success" : "secondary"}>{habitDone[habit.id] ? "Done" : "Open"}</Badge>
              </div>
            ))}
            {!habits.length ? <EmptyState text="Create your first habit." action="Open habits" onClick={() => onNavigate("habits")} /> : null}
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Goals</CardTitle>
            <CardDescription>Local until backend goal routes are added.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {goals.slice(0, 3).map((goal) => (
              <div key={goal.id} className="rounded-md border p-3">
                <div className="flex justify-between gap-3 text-sm font-semibold">
                  <span>{goal.title}</span>
                  <span>{goal.progress}%</span>
                </div>
                <Progress value={goal.progress} className="mt-3" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
            <CardDescription>{tasks.filter((task) => !task.done).length} pending today.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {tasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between rounded-md border p-3">
                <span className={cn("text-sm font-semibold", task.done && "text-muted-foreground line-through")}>{task.title}</span>
                <Badge variant={task.priority === "High" ? "warning" : "secondary"}>{task.priority}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function CheckinView({ value, onSaved }: { value: DailyState | null; onSaved: (state: DailyState) => void }) {
  const [date, setDate] = useState(value?.date ?? todayIso)
  const [energy, setEnergy] = useState<DailyState["energy_level"]>(value?.energy_level ?? "medium")
  const [mood, setMood] = useState<DailyState["mood"]>(value?.mood ?? "neutral")
  const [rating, setRating] = useState(value?.self_rating ?? 4)
  const [note, setNote] = useState(value?.note ?? "")
  const [status, setStatus] = useState("")
  const [statusTone, setStatusTone] = useState<"info" | "warning" | "error">("info")
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setStatus("")
    setStatusTone("info")
    const payload = { date, energy_level: energy, mood, self_rating: rating, note }
    let duplicateMessage = ""

    try {
      const saved = await api.dailyState.create(payload).catch(async (error) => {
        if (error instanceof ApiError && error.status === 400) {
          const updated = await api.dailyState.update(date, payload)
          duplicateMessage = error.message
          return updated
        }
        throw error
      })
      onSaved(normalizeDailyState(saved) ?? payload)
      if (duplicateMessage) {
        setStatusTone("warning")
        setStatus(duplicateMessage)
      } else {
        setStatusTone("info")
        setStatus("Daily check-in synced.")
      }
    } catch (error) {
      onSaved(payload)
      setStatusTone("error")
      setStatus(error instanceof ApiError ? `${error.message}. Saved locally.` : "Saved locally.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <CardTitle>Daily check-in</CardTitle>
          <CardDescription>Backend synced with local fallback.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                Date
                <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Energy
                <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={energy} onChange={(event) => setEnergy(event.target.value as DailyState["energy_level"])}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium">
              Mood
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={mood} onChange={(event) => setMood(event.target.value as DailyState["mood"])}>
                <option value="happy">Happy</option>
                <option value="neutral">Neutral</option>
                <option value="sad">Sad</option>
                <option value="angry">Angry</option>
                <option value="stressed">Stressed</option>
              </select>
            </label>
            <RangeControl label="Self-rating" value={rating} onChange={setRating} />
            <label className="space-y-2 text-sm font-medium">
              Reflection
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            {status ? (
              <p
                className={cn(
                  "rounded-md p-3 text-sm",
                  statusTone === "warning" && "bg-amber-50 text-amber-800",
                  statusTone === "error" && "bg-red-50 text-red-700",
                  statusTone === "info" && "bg-slate-100 text-slate-700",
                )}
              >
                {status}
              </p>
            ) : null}
            <Button className="w-full" disabled={saving}>
              <Check />
              {saving ? "Saving..." : "Save check-in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>This is what the dashboard will read.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <SummaryTile label="Mood" value={mood ?? "-"} />
          <SummaryTile label="Energy" value={energy ?? "-"} />
          <SummaryTile label="Rating" value={`${rating}/5`} />
        </CardContent>
      </Card>
    </div>
  )
}

function HabitsView({
  habits,
  setHabits,
  habitDate,
  setHabitDate,
  habitDone,
  setHabitDone,
}: {
  habits: Habit[]
  setHabits: (habits: Habit[]) => void
  habitDate: string
  setHabitDate: (date: string) => void
  habitDone: Record<string, boolean>
  setHabitDone: (done: Record<string, boolean>) => void
}) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Health")
  const [why, setWhy] = useState("")
  const [cue, setCue] = useState("")
  const [routine, setRoutine] = useState("")
  const [reward, setReward] = useState("")
  const [startDate, setStartDate] = useState(todayIso)
  const [durationDays, setDurationDays] = useState(66)
  const [status, setStatus] = useState("")
  const [savingLog, setSavingLog] = useState<Record<string, boolean>>({})

  const endDate = addDays(startDate, durationDays - 1)
  const phases = buildHabitPhases(durationDays)
  const activeHabits = habits.filter((habit) => isDateInHabitPeriod(habit, habitDate))
  const activeCompleted = activeHabits.filter((habit) => habitDone[habit.id]).length
  const remaining = Math.max(activeHabits.length - activeCompleted, 0)
  const completion = activeHabits.length ? Math.round((activeCompleted / activeHabits.length) * 100) : 0

  async function createHabit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setStatus("")
    const richHabit: Habit = {
      id: crypto.randomUUID(),
      title: trimmedTitle,
      category,
      why,
      cue,
      routine,
      reward,
      start_date: startDate,
      end_date: endDate,
      duration_days: durationDays,
      phases,
      is_active: true,
    }

    try {
      const created = normalizeHabit(await api.habits.create(richHabit))
      setHabits([{ ...richHabit, ...created, id: created?.id ?? richHabit.id }, ...habits])
      setStatus("Habit contract created. Daily tracking is ready.")
    } catch (error) {
      setHabits([richHabit, ...habits])
      setStatus(error instanceof ApiError ? `${error.message}. Created locally.` : "Created locally.")
    }

    setTitle("")
    setWhy("")
    setCue("")
    setRoutine("")
    setReward("")
    setCategory("Health")
    setStartDate(todayIso)
    setDurationDays(66)
    setOpen(false)
  }

  async function toggleHabit(habit: Habit) {
    const next = !habitDone[habit.id]
    setHabitDone({ ...habitDone, [habit.id]: next })
    setSavingLog({ ...savingLog, [habit.id]: true })

    try {
      await api.habits.setLog(habit.id, habitDate, next)
      setStatus(next ? "Habit checked for this day." : "Habit unchecked for this day.")
    } catch (error) {
      setStatus(error instanceof ApiError ? `${error.message}. Saved locally.` : "Saved locally.")
    } finally {
      setSavingLog((current) => ({ ...current, [habit.id]: false }))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Habit management</h2>
          <p className="text-sm text-muted-foreground">Design the habit first, commit to a period, then track the daily proof.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">66-day build recommended</Badge>
          <Button onClick={() => setOpen(true)}>
            <Plus />
            Create habit
          </Button>
        </div>
      </div>
      {status ? <Toast message={status} onClose={() => setStatus("")} /> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex size-12 items-center justify-center rounded-md bg-cyan-100 text-cyan-700">
              <CalendarCheck />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tracking date</p>
              <Input className="mt-1 h-8 w-40" type="date" value={habitDate} onChange={(event) => setHabitDate(event.target.value)} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="mt-2 text-3xl font-bold">{activeCompleted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="mt-2 text-3xl font-bold">{remaining}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Daily completion</p>
            <p className="mt-2 text-3xl font-bold">{completion}%</p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Daily checklist</CardTitle>
            <CardDescription>Only habits active in the selected period appear here.</CardDescription>
          </div>
          <Badge variant={completion === 100 && activeHabits.length ? "success" : "secondary"}>{activeCompleted}/{activeHabits.length} done</Badge>
        </CardHeader>
        <CardContent>
          {activeHabits.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeHabits.map((habit) => {
                const done = Boolean(habitDone[habit.id])
                const phase = getHabitPhase(habit, habitDate)
                return (
                  <div key={habit.id} className={cn("rounded-lg border bg-white p-4 shadow-sm transition", done && "border-emerald-200 bg-emerald-50/60")}>
                    <div className="flex items-start justify-between gap-3">
                      <button
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-md border transition",
                          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-200 bg-slate-50 text-slate-400 hover:border-cyan-400 hover:text-cyan-700",
                        )}
                        onClick={() => toggleHabit(habit)}
                        disabled={savingLog[habit.id]}
                        aria-label={`${done ? "Uncheck" : "Check"} ${habit.title}`}
                      >
                        <Check />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate font-semibold", done && "text-emerald-900")}>{habit.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge variant={done ? "success" : "secondary"}>{done ? "Maintained" : "Not yet"}</Badge>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">{habit.category}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full transition-all", done ? "w-full bg-emerald-500" : "w-1/4 bg-cyan-400")} />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {phase ? `${phase.title}: ${phase.focus}` : "Tap the check button when this habit is done today."}
                    </p>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState text="No active habits for this date." action="Create habit above" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My habits</CardTitle>
          <CardDescription>Active contracts are locked until the experiment period ends.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {habits.map((habit) => {
            const locked = isHabitLocked(habit)
            const progress = getHabitProgress(habit, todayIso)
            const contract = getHabitContractCopy(habit)
            return (
              <div key={habit.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{habit.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{habit.start_date ?? todayIso} to {habit.end_date ?? "open"}</p>
                  </div>
                  <Badge variant={locked ? "warning" : "success"}>{locked ? "Locked" : "Complete"}</Badge>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{contract.why}</p>
                <Progress value={progress} className="mt-4 h-2" />
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <span>Cue: {contract.cue}</span>
                  <span>Routine: {contract.routine}</span>
                  <span>Reward: {contract.reward}</span>
                </div>
              </div>
            )
          })}
          {!habits.length ? <EmptyState text="No habit contracts yet." /> : null}
        </CardContent>
      </Card>

      <Modal open={open} title="Create habit contract" onClose={() => setOpen(false)} size="wide">
        <form className="space-y-5" onSubmit={createHabit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Habit name
              <Input placeholder="Read for 20 minutes" value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Life area
              <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
                {habitCategories.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <label className="space-y-2 text-sm font-medium">
            Why this matters
            <Textarea placeholder="What will this unlock if you keep it?" value={why} onChange={(event) => setWhy(event.target.value)} />
          </label>
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="space-y-2 text-sm font-medium">
              Cue
              <Input placeholder="After morning coffee" value={cue} onChange={(event) => setCue(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Routine
              <Input placeholder="Open book and read" value={routine} onChange={(event) => setRoutine(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Reward
              <Input placeholder="Mark streak and tea" value={reward} onChange={(event) => setReward(event.target.value)} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-[0.75fr_1.25fr]">
            <label className="space-y-2 text-sm font-medium">
              Start date
              <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <div className="space-y-2">
              <p className="text-sm font-medium">Experiment length</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { days: 30, label: "30 days", detail: "starter" },
                  { days: 66, label: "66 days", detail: "recommended" },
                  { days: 90, label: "90 days", detail: "identity" },
                ].map((option) => (
                  <button
                    key={option.days}
                    type="button"
                    className={cn(
                      "rounded-md border p-3 text-left text-sm transition",
                      durationDays === option.days ? "border-cyan-500 bg-cyan-50 text-cyan-900" : "bg-white hover:border-cyan-300",
                    )}
                    onClick={() => setDurationDays(option.days)}
                  >
                    <span className="block font-bold">{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.detail}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-md border bg-slate-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold">Suggested structure</p>
                <p className="text-sm text-muted-foreground">{startDate} to {endDate}. Split into {phases.length} sub-periods.</p>
              </div>
              <Badge variant="secondary">{durationDays} days</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {phases.map((phase) => (
                <div key={phase.title} className="rounded-md border bg-white p-3">
                  <p className="text-sm font-bold">{phase.title}</p>
                  <p className="text-xs font-semibold uppercase text-cyan-700">Days {phase.start_day}-{phase.end_day}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{phase.focus}</p>
                </div>
              ))}
            </div>
          </div>
          <Button className="w-full" size="lg">
            <Plus />
            Create habit contract
          </Button>
        </form>
      </Modal>
    </div>
  )
}

function GoalsView({
  goals,
  setGoals,
  tasks,
  setTasks,
}: {
  goals: Goal[]
  setGoals: (goals: Goal[]) => void
  tasks: Task[]
  setTasks: (tasks: Task[]) => void
}) {
  const [goalOpen, setGoalOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [goalTitle, setGoalTitle] = useState("")
  const [taskTitle, setTaskTitle] = useState("")

  function createGoal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setGoals([{ id: crypto.randomUUID(), title: goalTitle, area: "Work", due: todayIso, progress: 0, status: "Active" }, ...goals])
    setGoalTitle("")
    setGoalOpen(false)
  }

  function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTasks([{ id: crypto.randomUUID(), title: taskTitle, goal: "Independent", priority: "Medium", done: false }, ...tasks])
    setTaskTitle("")
    setTaskOpen(false)
  }

  function updateGoalProgress(goal: Goal, progress: number) {
    setGoals(goals.map((item) => (item.id === goal.id ? { ...item, progress } : item)))
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Goal roadmap</CardTitle>
            <CardDescription>Functional local goals until backend routes are added.</CardDescription>
          </div>
          <Button onClick={() => setGoalOpen(true)}>
            <Target />
            Add goal
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="rounded-md border p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{goal.title}</p>
                  <p className="text-sm text-muted-foreground">{goal.area} - Due {goal.due}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setGoals(goals.filter((item) => item.id !== goal.id))}>
                  <Trash2 />
                </Button>
              </div>
              <RangeControl label="Progress" value={goal.progress} max={100} onChange={(value) => updateGoalProgress(goal, value)} />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Daily task list</CardTitle>
            <CardDescription>Click the checkbox to complete.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setTaskOpen(true)}>
            <Plus />
            Task
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-start gap-3 rounded-md border p-3">
              <Checkbox checked={task.done} onClick={() => setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item))} />
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-semibold", task.done && "text-muted-foreground line-through")}>{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.goal}</p>
              </div>
              <Badge variant={task.priority === "High" ? "warning" : "secondary"}>{task.priority}</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
      <Modal open={goalOpen} title="Create goal" onClose={() => setGoalOpen(false)}>
        <form className="space-y-4" onSubmit={createGoal}>
          <Input value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="Goal title" required />
          <Button className="w-full">Create goal</Button>
        </form>
      </Modal>
      <Modal open={taskOpen} title="Create task" onClose={() => setTaskOpen(false)}>
        <form className="space-y-4" onSubmit={createTask}>
          <Input value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Task title" required />
          <Button className="w-full">Create task</Button>
        </form>
      </Modal>
    </div>
  )
}

function AnalyticsView({ completion }: { completion: number }) {
  const [analytics, setAnalytics] = useState<HabitAnalytics[]>(fallbackHabitAnalytics)

  useEffect(() => {
    api.habits
      .analytics()
      .then((data) => {
        const loaded = asArray(data).map((item) => normalizeHabitAnalytics(item)).filter(Boolean) as HabitAnalytics[]
        if (loaded.length) setAnalytics(loaded)
      })
      .catch(() => setAnalytics(fallbackHabitAnalytics))
  }, [])

  const averageAdherence = Math.round(
    analytics.reduce((sum, habit) => sum + Math.round((habit.checked / Math.max(habit.elapsed, 1)) * 100), 0) / analytics.length,
  )
  const averageContractProgress = Math.round(
    analytics.reduce((sum, habit) => sum + Math.round((habit.day / habit.duration) * 100), 0) / analytics.length,
  )
  const atRisk = analytics.filter((habit) => habit.checked / Math.max(habit.elapsed, 1) < 0.7).length
  const phaseChartData = analytics.map((habit) => ({
    name: habit.name,
    Design: phasePercent(habit.phases[0]),
    Install: phasePercent(habit.phases[1]),
    Stabilize: phasePercent(habit.phases[2]),
    Identity: phasePercent(habit.phases[3]),
  }))

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Today checked</p>
            <p className="mt-2 text-3xl font-bold">{completion}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Avg adherence</p>
            <p className="mt-2 text-3xl font-bold">{averageAdherence}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Contract progress</p>
            <p className="mt-2 text-3xl font-bold">{averageContractProgress}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Needs attention</p>
            <p className="mt-2 text-3xl font-bold">{atRisk}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <TrendCard />
        <Card>
          <CardHeader>
            <CardTitle>Habit contract progress</CardTitle>
            <CardDescription>Phase adherence by habit, computed from contract periods and daily logs.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseChartData} layout="vertical" margin={{ left: 16, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d6e3e6" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={120} stroke="#64748b" tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="Design" fill="#0f9f8f" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Install" fill="#14b8a6" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Stabilize" fill="#38bdf8" radius={[4, 4, 4, 4]} />
                <Bar dataKey="Identity" fill="#f59e0b" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {analytics.map((habit) => {
          const adherence = Math.round((habit.checked / Math.max(habit.elapsed, 1)) * 100)
          const contractProgress = Math.round((habit.day / habit.duration) * 100)
          return (
            <Card key={habit.name}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{habit.name}</CardTitle>
                    <CardDescription>{habit.start} to {habit.end}</CardDescription>
                  </div>
                  <Badge variant={adherence >= 80 ? "success" : adherence >= 70 ? "warning" : "destructive"}>{adherence}%</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-medium">Contract day {habit.day}/{habit.duration}</span>
                    <span className="text-muted-foreground">{contractProgress}%</span>
                  </div>
                  <Progress value={contractProgress} />
                </div>
                <div className="grid gap-2">
                  {habit.phases.map((phase) => {
                    const value = phasePercent(phase)
                    return (
                      <div key={phase.name}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-semibold">{phase.name}</span>
                          <span className="text-muted-foreground">{phase.completed}/{phase.total}</span>
                        </div>
                        <Progress value={value} />
                      </div>
                    )
                  })}
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">Period heatmap</span>
                    <Badge variant="secondary">{habit.currentPhase}</Badge>
                  </div>
                  <div className="grid grid-cols-11 gap-1">
                    {habit.heatmap.slice(0, habit.duration).split("").map((day, index) => (
                      <span
                        key={`${habit.name}-${index}`}
                        className={cn(
                          "aspect-square rounded-sm border",
                          index >= habit.elapsed && "border-slate-200 bg-slate-50",
                          index < habit.elapsed && day === "1" && "border-emerald-300 bg-emerald-400",
                          index < habit.elapsed && day !== "1" && "border-rose-200 bg-rose-100",
                        )}
                        title={`Day ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="rounded-md bg-slate-50 p-3 text-sm text-muted-foreground">{habit.insight}</p>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <ReportsTable />
    </div>
  )
}

function ReportsTable() {
  async function downloadCsv() {
    try {
      const blob = await api.reports.export("csv")
      downloadBlob(blob, "lifeos-report.csv")
    } catch {
      const csv = ["Metric,This week,Previous", ...reportRows.map((row) => `${row.metric},${row.week},${row.previous}`)].join("\n")
      downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8" }), "lifeos-report.csv")
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Weekly report</CardTitle>
          <CardDescription>Downloads from backend when available, otherwise exports current table.</CardDescription>
        </div>
        <Button variant="outline" onClick={downloadCsv}>
          <Download />
          CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          {reportRows.map((row) => (
            <div key={row.metric} className="grid grid-cols-3 gap-3 p-3 text-sm even:bg-slate-50">
              <span className="font-medium">{row.metric}</span>
              <span>{row.week}</span>
              <span className="text-muted-foreground">Prev {row.previous}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function JournalView({ notes, setNotes }: { notes: JournalNote[]; setNotes: (notes: JournalNote[]) => void }) {
  const [title, setTitle] = useState("Thursday reflection")
  const [body, setBody] = useState("")
  const [win, setWin] = useState("")
  const [lesson, setLesson] = useState("")
  const [query, setQuery] = useState("")
  const visible = notes.filter((note) => `${note.title} ${note.body} ${note.win} ${note.lesson}`.toLowerCase().includes(query.toLowerCase()))

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotes([{ id: crypto.randomUUID(), title, body, win, lesson, createdAt: new Date().toISOString() }, ...notes])
    setTitle("")
    setBody("")
    setWin("")
    setLesson("")
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Daily journal</CardTitle>
          <CardDescription>Creates searchable local notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={save}>
            <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
            <Textarea placeholder="Write freely..." className="min-h-[220px]" value={body} onChange={(event) => setBody(event.target.value)} required />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Win of the day" value={win} onChange={(event) => setWin(event.target.value)} />
              <Input placeholder="Lesson learned" value={lesson} onChange={(event) => setLesson(event.target.value)} />
            </div>
            <Button className="w-full">Save note</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Prompts and previous notes</CardTitle>
          <CardDescription>{notes.length} notes saved.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search notes..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="grid gap-3 md:grid-cols-3">
            {journalPrompts.map((prompt) => <div key={prompt} className="rounded-md border bg-white p-4 text-sm font-medium">{prompt}</div>)}
          </div>
          <Separator />
          {visible.map((note) => (
            <div key={note.id} className="rounded-md border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{note.title}</p>
                <Button variant="ghost" size="icon" onClick={() => setNotes(notes.filter((item) => item.id !== note.id))}>
                  <Trash2 />
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{note.body}</p>
              {note.win ? <p className="mt-2 text-xs text-teal-700">Win: {note.win}</p> : null}
            </div>
          ))}
          {!visible.length ? <p className="text-sm text-muted-foreground">No notes found.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsView({ reminders, setReminders }: { reminders: Reminder[]; setReminders: (items: Reminder[]) => void }) {
  function toggle(id: string) {
    setReminders(reminders.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  function markRead(id: string) {
    setReminders(reminders.map((item) => item.id === id ? { ...item, read: true } : item))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification center</CardTitle>
        <CardDescription>Reminder preferences and read state are persisted locally.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reminders.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
            <button className="min-w-0 flex-1 text-left" onClick={() => markRead(item.id)}>
              <p className={cn("text-sm font-semibold", item.read && "text-muted-foreground")}>{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.time} {item.read ? "- read" : "- unread"}</p>
            </button>
            <Switch checked={item.enabled} onClick={() => toggle(item.id)} />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function SettingsView({ reminders, setReminders }: { reminders: Reminder[]; setReminders: (items: Reminder[]) => void }) {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [timezone, setTimezone] = useState(user?.timezone ?? "Asia/Dhaka")
  const [status, setStatus] = useState("")

  useEffect(() => {
    setFullName(user?.full_name ?? "")
    setTimezone(user?.timezone ?? "Asia/Dhaka")
  }, [user])

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStatus("")
    try {
      const updated = await api.users.updateProfile({ full_name: fullName, timezone })
      setUser(updated)
      setStatus("Profile synced.")
    } catch (error) {
      const localUser = user ? { ...user, full_name: fullName, timezone } : null
      setUser(localUser)
      setStatus(error instanceof ApiError ? `${error.message}. Updated locally.` : "Updated locally.")
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.75fr_1.25fr]">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Synced from login and backend profile.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={updateProfile}>
            <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            <Input value={user?.email ?? ""} disabled />
            <Input value={timezone} onChange={(event) => setTimezone(event.target.value)} />
            {status ? <p className="rounded-md bg-slate-100 p-3 text-sm text-slate-700">{status}</p> : null}
            <Button>Update profile</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Notifications and reminders</CardTitle>
          <CardDescription>Toggles are working and persist locally.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reminders.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
              <Switch checked={item.enabled} onClick={() => setReminders(reminders.map((reminder) => reminder.id === item.id ? { ...reminder, enabled: !reminder.enabled } : reminder))} />
            </div>
          ))}
          <Separator />
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline">
              <Clock3 />
              Quiet hours
            </Button>
            <Button variant="outline" onClick={() => navigate("/logout")}>
              <LogOut />
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/"

  if (isAuthenticated) return <Navigate to={from} replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to log in. Check the backend server.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Your day, finally connected." subtitle="Log in to sync your profile, habits, daily state, and reviews.">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Backend: {API_BASE_URL}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <Button className="w-full" disabled={submitting}>{submitting ? "Logging in..." : "Login"}</Button>
            <button type="button" className="text-sm font-medium text-teal-700" onClick={() => navigate("/register")}>Create account</button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function RegisterPage() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [timezone, setTimezone] = useState("Asia/Dhaka")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) return <Navigate to="/" replace />

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setSubmitting(true)
    try {
      await register({ full_name: fullName, email, password, timezone })
      navigate("/", { replace: true })
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to register.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Set up your personal operating system." subtitle="Create an account and start tracking your patterns.">
      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Registers against your backend API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Input placeholder="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            <Input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <Input placeholder="Timezone" value={timezone} onChange={(event) => setTimezone(event.target.value)} required />
            {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
            <Button className="w-full" disabled={submitting}>{submitting ? "Creating..." : "Create account"}</Button>
            <button type="button" className="text-sm font-medium text-teal-700" onClick={() => navigate("/login")}>Already have an account? Login</button>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  )
}

function LogoutPage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    logout().finally(() => navigate("/login", { replace: true }))
  }, [logout, navigate])

  return <LoadingScreen />
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between p-6 sm:p-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-extrabold">LifeOS</p>
              <p className="text-xs font-medium text-slate-300">Track. Plan. Review.</p>
            </div>
          </div>
          <div className="my-12 max-w-xl">
            <Badge className="border-white/20 bg-white/10 text-white hover:bg-white/10">Personal productivity OS</Badge>
            <h1 className="mt-5 text-4xl font-extrabold tracking-normal sm:text-6xl">{title}</h1>
            <p className="mt-5 text-base leading-7 text-slate-300">{subtitle}</p>
          </div>
          <div />
        </section>
        <section className="flex items-center justify-center bg-background p-4 text-foreground sm:p-8">
          <div className="w-full max-w-md">{children}</div>
        </section>
      </div>
    </div>
  )
}

function TrendCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>7-day mood and productivity</CardTitle>
        <CardDescription>Visual analytics for weekly review.</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="mood" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0f9f8f" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#0f9f8f" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#d6e3e6" />
            <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} domain={[0, 5]} />
            <Tooltip />
            <Area type="monotone" dataKey="mood" stroke="#0f9f8f" fill="url(#mood)" strokeWidth={3} />
            <Line type="monotone" dataKey="productivity" stroke="#f59e0b" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function CalendarView() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_0.45fr]">
      <Card>
        <CardHeader>
          <CardTitle>Calendar and timeline</CardTitle>
          <CardDescription>Mood color, habit completion, and missed check-ins.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => (
              <div key={day.day} className={cn("aspect-square rounded-md border p-2 text-xs", day.completed > 85 ? "border-emerald-200 bg-emerald-50" : day.completed > 65 ? "border-teal-200 bg-teal-50" : "border-amber-200 bg-amber-50")}>
                <div className="flex items-center justify-between">
                  <span className="font-bold">{day.day}</span>
                  <span>{day.completed}%</span>
                </div>
                <p className="mt-2 truncate text-muted-foreground">{day.mood}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Monthly completion</CardTitle>
          <CardDescription>Demo calendar data for now.</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={calendarDays.slice(0, 14)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d6e3e6" />
              <XAxis dataKey="day" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="completed" radius={[6, 6, 0, 0]} fill="#0f9f8f" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="rounded-lg border bg-white p-6 text-center shadow-soft">
        <Sparkles className="mx-auto h-8 w-8 animate-pulse text-teal-700" />
        <p className="mt-4 text-sm font-semibold">Loading LifeOS</p>
      </div>
    </div>
  )
}

function RangeControl({ label, value, max = 5, onChange }: { label: string; value: number; max?: number; onChange: (value: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <input type="range" min="0" max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-teal-600" />
    </div>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-bold capitalize">{value}</p>
    </div>
  )
}

function EmptyState({ text, action, onClick }: { text: string; action?: string; onClick?: () => void }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {action && onClick ? <Button className="mt-3" size="sm" onClick={onClick}>{action}</Button> : null}
    </div>
  )
}

function Modal({
  open,
  title,
  children,
  onClose,
  size = "default",
}: {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  size?: "default" | "wide"
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className={cn("max-h-[90vh] w-full overflow-y-auto rounded-lg border bg-white p-5 shadow-soft", size === "wide" ? "max-w-4xl" : "max-w-md")}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-md border bg-white p-3 text-sm shadow-sm">
      <span>{message}</span>
      <Button variant="ghost" size="icon" onClick={onClose}>
        <X />
      </Button>
    </div>
  )
}

function useLocalStorage<T>(key: string, initialValue: T) {
  const initialValueJson = JSON.stringify(initialValue)
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    if (!stored) return initialValue
    try {
      return JSON.parse(stored) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    const stored = localStorage.getItem(key)
    if (!stored) {
      setValue(JSON.parse(initialValueJson) as T)
      return
    }
    try {
      setValue(JSON.parse(stored) as T)
    } catch {
      setValue(JSON.parse(initialValueJson) as T)
    }
  }, [initialValueJson, key])

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function asArray(data: unknown): unknown[] {
  return Array.isArray(data) ? data : []
}

function dateToUtc(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return Date.UTC(year || 1970, (month || 1) - 1, day || 1)
}

function addDays(value: string, days: number) {
  const date = new Date(dateToUtc(value))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysBetween(start: string, end: string) {
  return Math.floor((dateToUtc(end) - dateToUtc(start)) / 86400000)
}

function buildHabitPhases(duration: number): HabitPhase[] {
  if (duration <= 30) {
    return [
      { title: "Design", start_day: 1, end_day: 3, focus: "Make the habit tiny, obvious, and easy to start." },
      { title: "Install", start_day: 4, end_day: 14, focus: "Repeat the same cue and protect the first small win." },
      { title: "Stabilize", start_day: 15, end_day: duration, focus: "Reduce friction and keep the log honest." },
    ]
  }

  if (duration <= 66) {
    return [
      { title: "Design", start_day: 1, end_day: 7, focus: "Define the cue, minimum action, and reward." },
      { title: "Install", start_day: 8, end_day: 21, focus: "Make repetition boring, visible, and low effort." },
      { title: "Stabilize", start_day: 22, end_day: 45, focus: "Handle missed days without restarting the identity." },
      { title: "Identity", start_day: 46, end_day: duration, focus: "Turn the action into the kind of person you are becoming." },
    ]
  }

  return [
    { title: "Design", start_day: 1, end_day: 10, focus: "Shape a clean environment and clear trigger." },
    { title: "Install", start_day: 11, end_day: 30, focus: "Repeat the minimum version until it feels automatic." },
    { title: "Stabilize", start_day: 31, end_day: 60, focus: "Increase reliability before increasing ambition." },
    { title: "Identity", start_day: 61, end_day: duration, focus: "Review, deepen, and make the habit part of your operating system." },
  ]
}

function phasePercent(phase?: { completed: number; total: number }) {
  return phase?.total ? Math.round((phase.completed / phase.total) * 100) : 0
}

function isDateInHabitPeriod(habit: Habit, date: string) {
  const start = habit.start_date ?? todayIso
  const end = habit.end_date ?? addDays(start, (habit.duration_days ?? 66) - 1)
  return dateToUtc(date) >= dateToUtc(start) && dateToUtc(date) <= dateToUtc(end)
}

function isHabitLocked(habit: Habit) {
  const end = habit.end_date ?? addDays(habit.start_date ?? todayIso, (habit.duration_days ?? 66) - 1)
  return dateToUtc(todayIso) <= dateToUtc(end)
}

function getHabitProgress(habit: Habit, date: string) {
  const start = habit.start_date ?? todayIso
  const end = habit.end_date ?? addDays(start, (habit.duration_days ?? 66) - 1)
  const total = Math.max(daysBetween(start, end) + 1, 1)
  const elapsed = Math.min(Math.max(daysBetween(start, date) + 1, 0), total)
  return Math.round((elapsed / total) * 100)
}

function getHabitPhase(habit: Habit, date: string) {
  const start = habit.start_date ?? todayIso
  const day = Math.max(daysBetween(start, date) + 1, 1)
  const phases = habit.phases?.length ? habit.phases : buildHabitPhases(habit.duration_days ?? 66)
  return phases.find((phase) => day >= phase.start_day && day <= phase.end_day)
}

function getHabitContractCopy(habit: Habit) {
  const title = habit.title.toLowerCase()
  const area = habit.category || "Personal"
  const areaWhy: Record<string, string> = {
    Health: "Build a stronger body and steadier daily energy.",
    Mind: "Create a calmer, sharper mind through repeated practice.",
    Work: "Protect deep work and make progress visible.",
    Learning: "Turn curiosity into retained skill through repetition.",
    Spiritual: "Make space for reflection, grounding, and inner alignment.",
    Personal: "Strengthen identity through one small promise kept daily.",
  }

  return {
    why: habit.why || areaWhy[area] || `Make ${habit.title} part of the person you are becoming.`,
    cue: habit.cue || (title.includes("read") ? "After evening tea" : title.includes("walk") ? "After waking up" : "After the first planned daily check-in"),
    routine: habit.routine || (title.includes("read") ? "Read one focused section" : title.includes("walk") ? "Walk for at least 10 minutes" : habit.title),
    reward: habit.reward || "Log the win and take one quiet minute to acknowledge it.",
  }
}

function normalizeHabit(data: unknown): Habit | null {
  if (!data || typeof data !== "object") return null
  const item = data as Record<string, unknown>
  const id = String(item.id ?? "")
  const title = String(item.title ?? item.name ?? "")
  if (!id || !title) return null
  const startDate = typeof item.start_date === "string" ? item.start_date : undefined
  const durationDays = typeof item.duration_days === "number" ? item.duration_days : undefined
  return {
    id,
    title,
    category: String(item.category ?? "Personal"),
    is_active: item.is_active !== false,
    why: typeof item.why === "string" ? item.why : undefined,
    cue: typeof item.cue === "string" ? item.cue : undefined,
    routine: typeof item.routine === "string" ? item.routine : undefined,
    reward: typeof item.reward === "string" ? item.reward : undefined,
    start_date: startDate,
    end_date: typeof item.end_date === "string" ? item.end_date : startDate && durationDays ? addDays(startDate, durationDays - 1) : undefined,
    duration_days: durationDays,
    phases: Array.isArray(item.phases) ? (item.phases as HabitPhase[]) : undefined,
  }
}

function normalizeHabitLog(data: unknown): HabitLog | null {
  if (!data || typeof data !== "object") return null
  const item = data as Record<string, unknown>
  const habitId = String(item.habit_id ?? "")
  const date = String(item.date ?? "")
  if (!habitId || !date) return null
  return {
    id: item.id ? String(item.id) : undefined,
    habit_id: habitId,
    date,
    status: item.status === true,
  }
}

function normalizeHabitAnalytics(data: unknown): HabitAnalytics | null {
  if (!data || typeof data !== "object") return null
  const item = data as Record<string, unknown>
  const name = String(item.name ?? item.title ?? "")
  if (!name) return null
  const phases = asArray(item.phases).map((phase) => {
    const phaseItem = phase as Record<string, unknown>
    const name = String(phaseItem.name ?? phaseItem.title ?? "")
    return {
      name,
      title: typeof phaseItem.title === "string" ? phaseItem.title : undefined,
      completed: Number(phaseItem.completed ?? 0),
      total: Number(phaseItem.total ?? 0),
      elapsed: typeof phaseItem.elapsed === "number" ? phaseItem.elapsed : undefined,
      percent: typeof phaseItem.percent === "number" ? phaseItem.percent : undefined,
    }
  })

  return {
    name,
    area: String(item.area ?? item.category ?? "Personal"),
    start: String(item.start ?? todayIso),
    end: String(item.end ?? todayIso),
    day: Number(item.day ?? 0),
    duration: Number(item.duration ?? 66),
    checked: Number(item.checked ?? 0),
    elapsed: Number(item.elapsed ?? 0),
    currentPhase: String(item.currentPhase ?? item.current_phase ?? "Habit"),
    insight: String(item.insight ?? "Keep tracking the habit to build analytics."),
    heatmap: String(item.heatmap ?? ""),
    phases,
  }
}

function normalizeDailyState(data: unknown): DailyState | null {
  if (!data || typeof data !== "object") return null
  const item = data as Record<string, unknown>
  return {
    id: item.id ? String(item.id) : undefined,
    date: String(item.date ?? todayIso),
    energy_level: item.energy_level as DailyState["energy_level"],
    mood: item.mood as DailyState["mood"],
    self_rating: typeof item.self_rating === "number" ? item.self_rating : undefined,
    note: typeof item.note === "string" ? item.note : undefined,
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default App
