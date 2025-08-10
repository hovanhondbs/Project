import React, { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import SearchInput from '../components/SearchInput';
import SearchResults from '../components/SearchResults';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000';

function SearchPage() {
  const location = useLocation();
  const initialQuery = location.state?.query || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/search`, {
        params: { query }
      });
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
      setResults({ flashcards: [], classes: [] });
    } finally {
      setLoading(false);
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
          onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
          placeholder="Search flashcards or classes..."
        />

        {loading && (
          <div className="text-gray-500 my-4">Searching…</div>
        )}

        <SearchResults results={results} />
      </main>
    </div>
  );
}

export default SearchPage;
