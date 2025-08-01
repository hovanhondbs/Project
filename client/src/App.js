import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage'; // 👈 Trang bạn đã tạo
import SignUpPage from './pages/SignUpPage';
import ChooseRolePage from './pages/ChooseRolePage';
import Dashboarduser from './pages/Dashboarduser';
import CreateFlashcardSet from './pages/CreateFlashcardSet';
import UserLibrary from './pages/UserLibrary';
import FlashcardSetDetail from './pages/FlashcardSetDetail';

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
        <Route path="/flashcards/:id/learn" element={<div>Learn Mode Coming Soon</div>} />
        <Route path="/flashcards/:id/test" element={<div>Test Mode Coming Soon</div>} />
        <Route path="/flashcards/:id/match" element={<div>Match Mode Coming Soon</div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
