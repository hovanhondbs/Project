import axios from 'axios';

const logLearningActivity = async () => {
  const userId = localStorage.getItem('userId');
  if (!userId) return;

  try {
    await axios.post('http://localhost:5000/api/activity/complete', { userId });
    console.log('🔥 Đã log hoạt động học.');
  } catch (error) {
    console.error('❌ Lỗi ghi log học:', error);
  }
};

export default logLearningActivity; // ✅ Xuất mặc định đúng
