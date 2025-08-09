import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import SearchResults from '../components/SearchResults';

function SearchPage() {
  const location = useLocation();
  const initialQuery = location.state?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/search?query=${encodeURIComponent(query)}`);
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
      setResults(null);
    }
  }, [query]);

  useEffect(() => {
    if (initialQuery) handleSearch();
  }, [initialQuery, handleSearch]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        
        <SearchResults results={results} />
          
      </main>
    </div>
  );
}

export default SearchPage;
