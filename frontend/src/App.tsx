import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import SessionSummary from './pages/SessionSummary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - Landing page with sign-in */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes - require authentication */}
        <Route
          path="/interview/:sessionId"
          element={
            <ProtectedRoute>
              <InterviewRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/summary/:sessionId"
          element={
            <ProtectedRoute>
              <SessionSummary />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
