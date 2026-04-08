import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import WeeklyMeetingPage from './pages/WeeklyMeetingPage'
import IssuesPage from './pages/IssuesPage'
import TodosPage from './pages/TodosPage'
import PastMeetingsPage from './pages/PastMeetingsPage'
import MeetingDetailPage from './pages/MeetingDetailPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<WeeklyMeetingPage />} />
          <Route path="/issues" element={<IssuesPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/meetings" element={<PastMeetingsPage />} />
          <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
