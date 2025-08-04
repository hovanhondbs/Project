import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage'; // 👈 Trang bạn đã tạo
import SignUpPage from './pages/SignUpPage';
import ChooseRolePage from './pages/ChooseRolePage';
import Dashboarduser from './pages/Dashboarduser';
import Dashboardteacher from './pages/Dashboardteacher';
import CreateFlashcardSet from './pages/CreateFlashcardSet';
import UserLibrary from './pages/UserLibrary';
import FlashcardSetDetail from './pages/FlashcardSetDetail';
import LearnMode from './components/LearnMode';
import TestMode from './components/TestMode';
import MatchMode from './components/MatchMode';
import AchievementsPage from './pages/AchievementsPage';
import CreateClassPage from './pages/CreateClassPage';
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/choose-role" element={<ChooseRolePage />} />
        <Route path="/dashboard-user" element={<Dashboarduser />} />
        <Route path="/flashcards" element={<CreateFlashcardSet />} />
        <Route path="/library" element={<UserLibrary />} />
        <Route path="/flashcards/:id" element={<FlashcardSetDetail />} />
        <Route path="/edit-flashcard/:id" element={<CreateFlashcardSet />} />
        <Route path="/flashcards/:id/learn" element={<LearnMode />} />
        <Route path="/flashcards/:id/test" element={<TestMode />} />
        <Route path="/flashcards/:id/match" element={<MatchMode />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/dashboard-teacher" element={<Dashboardteacher />} />
        <Route path="/create-class" element={<CreateClassPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
