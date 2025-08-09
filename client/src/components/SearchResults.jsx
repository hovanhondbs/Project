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
          <h3 className="text-lg font-medium text-blue-700 mb-3">Flashcard Sets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {results.flashcards.map((set) => (
              <Link
                key={set._id}
                to={`/flashcards/${set._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-blue-400 transition-all duration-300"
              >
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {set.cards?.length || 0} Terms
                  </span>
                  <div className="flex items-center">
                    {set.userId?.avatar ? (
                      <img 
                        src={set.userId.avatar} 
                        alt={set.userId.username}
                        className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs">
                        {set.userId?.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-gray-700">
                      {set.userId?.username || 'Unknown'}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-blue-700 truncate mb-1">{set.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                  {set.description || 'No description provided'}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Classes */}
      {results.classes?.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-green-700 mb-3">Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.classes.map((cls) => (
              <Link
                key={cls._id}
                to={`/classes/${cls._id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow hover:shadow-lg hover:border-green-400 transition-all duration-300"
              >
                <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    {cls.students?.length || 0} students
                  </span>
                  <div className="flex items-center">
                    {cls.createdBy?.avatar ? (
                      <img 
                        src={cls.createdBy.avatar} 
                        alt={cls.createdBy.username}
                        className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 mr-2 flex items-center justify-center text-xs">
                        {cls.createdBy?.username?.charAt(0).toUpperCase() || 'T'}
                      </div>
                    )}
                    <span className="text-gray-700">
                      {cls.createdBy?.username || 'Teacher'}
                    </span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-green-700 truncate mb-1">{cls.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 min-h-[40px]">
                  {cls.description || 'No description provided'}
                </p>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* Empty State */}
      {results.flashcards?.length === 0 && results.classes?.length === 0 && (
        <div className="text-center py-10">
          <p className="text-gray-500">No results found. Try different keywords.</p>
        </div>
      )}
    </div>
  );
}

export default SearchResults;