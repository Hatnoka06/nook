import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { LoginPage } from '@/features/auth/LoginPage'
import { OnboardingPage } from '@/features/auth/OnboardingPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { HomePage } from '@/features/dashboard/HomePage'
import { PlannerPage } from '@/features/calendar/PlannerPage'
import { TasksPage } from '@/features/tasks/TasksPage'
import { StudyPage } from '@/features/study/StudyPage'
import { DeadlinesPage } from '@/features/deadlines/DeadlinesPage'
import { CoursesPage } from '@/features/courses/CoursesPage'
import { CourseDetailPage } from '@/features/courses/CourseDetailPage'
import { SemestersPage } from '@/features/semesters/SemestersPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { MorePage } from '@/features/more/MorePage'
import { GradesPage } from '@/features/grades/GradesPage'
import { NotesPage } from '@/features/notes/NotesPage'
import { WellbeingPage } from '@/features/wellbeing/WellbeingPage'
import { FinancePage } from '@/features/finance/FinancePage'
import { AnalyticsPage } from '@/features/analytics/AnalyticsPage'
import { LanguagesPage } from '@/features/languages/LanguagesPage'
import { NotFoundPage } from '@/features/notFound/NotFoundPage'

export const appChildren: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/planner', element: <PlannerPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/study', element: <StudyPage /> },
  { path: '/deadlines', element: <DeadlinesPage /> },
  { path: '/courses', element: <CoursesPage /> },
  { path: '/courses/:id', element: <CourseDetailPage /> },
  { path: '/semesters', element: <SemestersPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/more', element: <MorePage /> },
  { path: '/grades', element: <GradesPage /> },
  { path: '/notes', element: <NotesPage /> },
  { path: '/wellbeing', element: <WellbeingPage /> },
  { path: '/finance', element: <FinancePage /> },
  { path: '/analytics', element: <AnalyticsPage /> },
  { path: '/languages', element: <LanguagesPage /> },
  { path: '*', element: <NotFoundPage /> },
]

export const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { element: <RequireAuth requireOnboarded={false} />, children: [{ path: '/onboarding', element: <OnboardingPage /> }] },
  { element: <RequireAuth />, children: [{ element: <AppLayout />, children: appChildren }] },
]
export const router = createBrowserRouter(routes)
