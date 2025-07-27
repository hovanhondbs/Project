import { Link } from 'react-router-dom';

function FlashcardSetItem({ set }) {
  return (
    <div className="border rounded-xl p-4 shadow hover:shadow-lg transition-all bg-white">
      <h2 className="text-xl font-semibold">{set.title}</h2>
      <p className="text-gray-600">{set.description}</p>
      <p className="text-sm text-gray-400 mt-1">Tạo lúc: {new Date(set.createdAt).toLocaleDateString()}</p>
      
      {/* Sau này bạn có thể thêm nút học */}
      <Link to={`/set/${set._id}`} className="mt-3 inline-block text-blue-600 hover:underline">
        Học ngay →
      </Link>
    </div>
  );
}

export default FlashcardSetItem;
