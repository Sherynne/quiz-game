import React, { useState, useEffect } from 'react';
import { Clock, Trophy, CheckCircle, XCircle, Play, RotateCcw } from 'lucide-react';

// Types
interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

interface GameState {
  status: 'idle' | 'playing' | 'finished';
  currentQuestionIndex: number;
  score: number;
  answers: (number | null)[];
  timeLeft: number;
  playerName: string;
}

// Sample questions data
const SAMPLE_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What does 'Web3' primarily refer to?",
    options: [
      "The third version of the internet",
      "A decentralized internet built on blockchain",
      "A web development framework",
      "A programming language"
    ],
    correctAnswer: 1,
    category: "Blockchain"
  },
  {
    id: 2,
    question: "Which consensus mechanism does Ethereum 2.0 use?",
    options: [
      "Proof of Work",
      "Proof of Stake",
      "Proof of Authority",
      "Delegated Proof of Stake"
    ],
    correctAnswer: 1,
    category: "Blockchain"
  },
  {
    id: 3,
    question: "What is a smart contract?",
    options: [
      "A legal document",
      "Self-executing code on the blockchain",
      "A type of cryptocurrency",
      "A digital wallet"
    ],
    correctAnswer: 1,
    category: "Smart Contracts"
  },
  {
    id: 4,
    question: "What does 'DeFi' stand for?",
    options: [
      "Digital Finance",
      "Decentralized Finance",
      "Defined Finance",
      "Derivative Finance"
    ],
    correctAnswer: 1,
    category: "DeFi"
  },
  {
    id: 5,
    question: "Which language is primarily used for Ethereum smart contracts?",
    options: [
      "JavaScript",
      "Python",
      "Solidity",
      "Rust"
    ],
    correctAnswer: 2,
    category: "Development"
  }
];

const TIME_PER_QUESTION = 30; // seconds

const QuizGame: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [gameState, setGameState] = useState<GameState>({
    status: 'idle',
    currentQuestionIndex: 0,
    score: 0,
    answers: [],
    timeLeft: TIME_PER_QUESTION,
    playerName: ''
  });
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Load questions on mount
  useEffect(() => {
    loadQuestions();
    loadLeaderboard();
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState.status === 'playing' && !showFeedback && gameState.timeLeft > 0) {
      const timer = setTimeout(() => {
        setGameState(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    } else if (gameState.timeLeft === 0 && !showFeedback) {
      handleTimeout();
    }
  }, [gameState.status, gameState.timeLeft, showFeedback]);

  const loadQuestions = () => {
    try {
      // In a real app, this would be an API call
      setQuestions(SAMPLE_QUESTIONS);
      setError(null);
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error loading questions:', err);
    }
  };

  const loadLeaderboard = () => {
    try {
      const saved = localStorage.getItem('quizLeaderboard');
      if (saved) {
        setLeaderboard(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    }
  };

  const saveToLeaderboard = (name: string, score: number) => {
    try {
      const entry: LeaderboardEntry = {
        name,
        score,
        date: new Date().toISOString()
      };
      const updated = [...leaderboard, entry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      setLeaderboard(updated);
      localStorage.setItem('quizLeaderboard', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving to leaderboard:', err);
    }
  };

  const startGame = () => {
    if (!gameState.playerName.trim()) {
      setError('Please enter your name to start');
      return;
    }
    if (questions.length === 0) {
      setError('No questions available. Please try again.');
      return;
    }
    setGameState({
      status: 'playing',
      currentQuestionIndex: 0,
      score: 0,
      answers: new Array(questions.length).fill(null),
      timeLeft: TIME_PER_QUESTION,
      playerName: gameState.playerName
    });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setError(null);
  };

  const handleAnswer = (answerIndex: number) => {
    if (showFeedback) return;
    setSelectedAnswer(answerIndex);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const currentQuestion = questions[gameState.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswers = [...gameState.answers];
    newAnswers[gameState.currentQuestionIndex] = selectedAnswer;
    
    setGameState(prev => ({
      ...prev,
      score: isCorrect ? prev.score + 1 : prev.score,
      answers: newAnswers
    }));
    
    setShowFeedback(true);
  };

  const handleTimeout = () => {
    const newAnswers = [...gameState.answers];
    newAnswers[gameState.currentQuestionIndex] = null;
    setGameState(prev => ({ ...prev, answers: newAnswers }));
    setShowFeedback(true);
  };

  const nextQuestion = () => {
    if (gameState.currentQuestionIndex < questions.length - 1) {
      setGameState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        timeLeft: TIME_PER_QUESTION
      }));
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameState(prev => ({ ...prev, status: 'finished' }));
    saveToLeaderboard(gameState.playerName, gameState.score);
  };

  const resetGame = () => {
    setGameState({
      status: 'idle',
      currentQuestionIndex: 0,
      score: 0,
      answers: [],
      timeLeft: TIME_PER_QUESTION,
      playerName: ''
    });
    setSelectedAnswer(null);
    setShowFeedback(false);
    setError(null);
    setShowLeaderboard(false);
  };

  const currentQuestion = questions[gameState.currentQuestionIndex];
  const progress = ((gameState.currentQuestionIndex + 1) / questions.length) * 100;

  // Start Screen
  if (gameState.status === 'idle') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Quiz Game</h1>
            <p className="text-gray-600">Test your Web3 knowledge!</p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Enter Your Name
            </label>
            <input
              type="text"
              value={gameState.playerName}
              onChange={(e) => setGameState(prev => ({ ...prev, playerName: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Your name"
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Quiz
          </button>

          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full mt-4 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
          >
            {showLeaderboard ? 'Hide' : 'View'} Leaderboard
          </button>

          {showLeaderboard && leaderboard.length > 0 && (
            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top Scores
              </h3>
              {leaderboard.map((entry, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="font-semibold text-gray-700">
                    {index + 1}. {entry.name}
                  </span>
                  <span className="text-blue-600 font-bold">
                    {entry.score}/{questions.length}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>{questions.length} questions • {TIME_PER_QUESTION}s per question</p>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  if (gameState.status === 'playing' && currentQuestion) {
    const isCorrect = showFeedback && selectedAnswer === currentQuestion.correctAnswer;
    const isWrong = showFeedback && selectedAnswer !== currentQuestion.correctAnswer && selectedAnswer !== null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span className="text-xl font-bold text-gray-800">
                Score: {gameState.score}/{questions.length}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
              gameState.timeLeft <= 10 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Clock className="w-5 h-5" />
              <span className="font-bold">{gameState.timeLeft}s</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {gameState.currentQuestionIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Category */}
          <div className="mb-4">
            <span className="inline-block bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
              {currentQuestion.category}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectOption = index === currentQuestion.correctAnswer;
              
              let optionClass = 'w-full text-left p-4 rounded-lg border-2 transition-all ';
              
              if (showFeedback) {
                if (isCorrectOption) {
                  optionClass += 'border-green-500 bg-green-50 ';
                } else if (isSelected && !isCorrectOption) {
                  optionClass += 'border-red-500 bg-red-50 ';
                } else {
                  optionClass += 'border-gray-200 bg-gray-50 ';
                }
              } else {
                optionClass += isSelected
                  ? 'border-blue-500 bg-blue-50 '
                  : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 ';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showFeedback}
                  className={optionClass}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800">{option}</span>
                    {showFeedback && isCorrectOption && (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    )}
                    {showFeedback && isSelected && !isCorrectOption && (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <div className={`p-4 rounded-lg mb-6 ${
              isCorrect ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
            }`}>
              <p className={`font-bold ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              </p>
              {isWrong && (
                <p className="text-sm text-gray-700 mt-1">
                  The correct answer was: {currentQuestion.options[currentQuestion.correctAnswer]}
                </p>
              )}
            </div>
          )}

          {/* Action Button */}
          {!showFeedback ? (
            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null}
              className={`w-full py-4 rounded-lg font-bold text-white transition-all ${
                selectedAnswer === null
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
              }`}
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={nextQuestion}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              {gameState.currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Results Screen
  if (gameState.status === 'finished') {
    const percentage = (gameState.score / questions.length) * 100;
    let message = '';
    let messageColor = '';

    if (percentage === 100) {
      message = 'Perfect Score! 🎉';
      messageColor = 'text-green-600';
    } else if (percentage >= 80) {
      message = 'Excellent! 🌟';
      messageColor = 'text-blue-600';
    } else if (percentage >= 60) {
      message = 'Good Job! 👍';
      messageColor = 'text-yellow-600';
    } else {
      message = 'Keep Practicing! 💪';
      messageColor = 'text-orange-600';
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
            <h1 className={`text-4xl font-bold mb-2 ${messageColor}`}>{message}</h1>
            <p className="text-gray-600">Quiz Completed</p>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center mb-6">
            <p className="text-lg mb-2">Your Score</p>
            <p className="text-5xl font-bold mb-2">
              {gameState.score}/{questions.length}
            </p>
            <p className="text-xl">{percentage.toFixed(0)}%</p>
          </div>

          {/* Review */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-4 text-xl">Review Answers</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {questions.map((q, index) => {
                const userAnswer = gameState.answers[index];
                const isCorrect = userAnswer === q.correctAnswer;
                
                return (
                  <div key={q.id} className={`p-3 rounded-lg border-2 ${
                    isCorrect ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                  }`}>
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">
                          Q{index + 1}: {q.question}
                        </p>
                        {!isCorrect && userAnswer !== null && (
                          <p className="text-xs text-red-600 mt-1">
                            Your answer: {q.options[userAnswer]}
                          </p>
                        )}
                        {!isCorrect && (
                          <p className="text-xs text-green-600 mt-1">
                            Correct: {q.options[q.correctAnswer]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizGame;