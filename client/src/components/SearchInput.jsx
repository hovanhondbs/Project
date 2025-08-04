import React from 'react';
import { FaSearch } from 'react-icons/fa';

function SearchInput({ placeholder = "Search for study guides", value, onChange, onKeyDown }) {
  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="w-full px-10 py-2 border rounded-2xl shadow-sm"
      />
      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
    </div>
  );
}

export default SearchInput;
