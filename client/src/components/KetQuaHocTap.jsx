import React from 'react';

function KetQuaHocTap({ score, total, mode = 'Learn', onRetry }) {
  const percent = Math.round((score / total) * 100);
  const message =
    percent === 100 ? '🎯 Perfect!'
    : percent >= 80 ? '👍 Well done!'
    : percent >= 50 ? '🙂 Keep practicing!'
    : '😅 Don’t give up!';

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">
        ✅ {mode} Mode Completed
      </h2>
      <p className="text-gray-700 text-lg mb-2">
        Correct Answers: <strong>{score}</strong> / {total}
      </p>
      <p className="text-gray-700 mb-2">
        Accuracy: <strong>{percent}%</strong>
      </p>
      <p className="text-indigo-500 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          🔁 Try Again
        </button>
      )}
    </div>
  );
}

export default KetQuaHocTap;
