import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import InterviewRoom from './pages/InterviewRoom';
import SessionSummary from './pages/SessionSummary';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/interview/:sessionId" element={<InterviewRoom />} />
        <Route path="/summary/:sessionId" element={<SessionSummary />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
