// components/SearchResults.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function SearchResults({ results }) {
  if (!results) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-2">Search Results</h2>

      {results.flashcards?.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-blue-700">Flashcard Sets</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {results.flashcards.map((set) => (
              <Link key={set._id} to={`/flashcards/${set._id}`} className="bg-white border rounded-xl p-5 shadow hover:border-blue-400">
                <h4 className="text-md font-semibold text-blue-700 truncate">{set.title}</h4>
                <p className="text-sm text-gray-500">{set.terms?.length || 0} terms</p>
              </Link>
            ))}
          </div>
        </>
      )}

      {results.classes?.length > 0 && (
        <>
          <h3 className="text-lg font-medium text-green-700">Classes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.classes.map((cls) => (
              <Link key={cls._id} to={`/class/${cls._id}`} className="bg-white border rounded-xl p-5 shadow hover:border-green-400">
                <h4 className="text-md font-semibold text-green-700 truncate">{cls.name}</h4>
                <p className="text-sm text-gray-500">ID: {cls._id}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default SearchResults;
