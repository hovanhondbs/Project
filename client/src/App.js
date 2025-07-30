import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage'; // 👈 Trang bạn đã tạo
import SignUpPage from './pages/SignUpPage';
import ChooseRolePage from './pages/ChooseRolePage';
import Dashboarduser from './pages/Dashboarduser';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/choose-role" element={<ChooseRolePage />} />
        <Route path="/dashboard-user" element={<Dashboarduser />} />
        {/* <Route path="/user" element={<UserHomePage />} />
        <Route path="/teacher" element={<TeacherHomePage />} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
