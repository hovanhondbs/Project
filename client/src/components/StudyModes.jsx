// src/components/StudyModes.jsx
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const StudyModes = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const modes = [
    {
      name: 'Learn',
      iconUrl: 'https://img.icons8.com/fluency/48/book.png',
      path: 'learn',
    },
    {
      name: 'Test',
      iconUrl: 'https://img.icons8.com/ios-filled/50/test-passed.png',
      path: 'test',
    },
    {
      name: 'Match',
      iconUrl: 'https://img.icons8.com/color/48/link--v1.png',
      path: 'match',
    },
  ];

  return (
    <div className="flex justify-center gap-6 mt-10">
      {modes.map((mode) => (
        <button
          key={mode.name}
          onClick={() => navigate(`/flashcards/${id}/${mode.path}`)}
          className="bg-white border rounded-lg p-5 w-32 text-center shadow transition hover:shadow-[0_4px_10px_#4255FF66]"
        >
          <img src={mode.iconUrl} alt={mode.name} className="w-8 h-8 mx-auto mb-2" />
          <div className="font-medium text-gray-700">{mode.name}</div>
        </button>
      ))}
    </div>
  );
};

export default StudyModes;
