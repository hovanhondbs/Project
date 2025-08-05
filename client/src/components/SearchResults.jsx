import React from 'react';
import { Link } from 'react-router-dom';

function SearchResults({ results }) {
  if (!results) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Search Results</h2>

      {/* Flashcard Sets */}
      {results.flashcards?.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-blue-700">Flashcard Sets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {results.flashcards.map((set) => (
              <Link
                key={set._id}
                to={`/flashcards/${set._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300"
              >
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{set.terms?.length || 0} Terms</span>
                  <span>{set.userId?.username || 'Unknown'}</span> {/* ✅ sửa đúng */}
                </div>
                <h3 className="text-xl font-semibold text-blue-700 truncate">{set.title}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{set.description || 'No description'}</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Classes */}
      {results.classes?.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-green-700">Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.classes.map((cls) => (
              <Link
                key={cls._id}
                to={`/class/${cls._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-green-400 transition-all duration-300"
              >
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{cls.students?.length || 0} students</span>
                  <span>{cls.createdBy?.username  || 'Unknown'}</span>
                </div>
                <h3 className="text-lg font-semibold text-green-700 truncate">{cls.name}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{cls.description || '...'}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SearchResults;
