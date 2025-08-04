// EditRemoveButtons.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function EditRemoveButtons({ flashcardId }) {
  const navigate = useNavigate();

  const handleEdit = () => {
    navigate(`/edit-flashcard/${flashcardId}`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this flashcard set?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/flashcards/${flashcardId}`);
      alert('Flashcard set deleted');
      navigate('/library');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete flashcard set');
    }
  };

  return (
    <div className="flex justify-end gap-3 mb-4">
      <button
        onClick={handleEdit}
        className="px-3 py-1 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50"
      >
        Edit
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-1 text-sm border border-red-500 text-red-600 rounded hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  );
}

export default EditRemoveButtons;
