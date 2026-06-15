import { BrowserRouter, Route, Routes } from 'react-router-dom'
import StudyHubApp from '../pages/StudyHubApp'
import { APP_ROUTE_PATTERNS } from '../constants/routes'

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {APP_ROUTE_PATTERNS.map((path) => (
          <Route element={<StudyHubApp />} key={path} path={path} />
        ))}
        <Route element={<StudyHubApp notFound />} path="*" />
      </Routes>
    </BrowserRouter>
  )
}
