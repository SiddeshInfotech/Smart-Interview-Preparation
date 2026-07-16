import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Plus,
  BookOpen,
  Gauge,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Zap,
  AlertCircle,
} from 'lucide-react';
import api from '../api/authAPI';
import '../styles/Quiz.css';
import PageNavbar from "../components/PageNavbar.jsx";

const Quiz = () => {
  const navigate = useNavigate();

  // --- Configuration state ---
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedMode, setSelectedMode] = useState('');
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(10);
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // --- Topic suggestion logic ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowTopicSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (newTopic.trim().length >= 1) {
        fetchTopicSuggestions(newTopic.trim());
      } else {
        setTopicSuggestions([]);
        setShowTopicSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [newTopic]);

  const fetchTopicSuggestions = async (query) => {
    setLoadingSuggestions(true);
    try {
      const response = await api.get(`/common/skills/?search=${encodeURIComponent(query)}`);
      const data = response.data;
      const skillsArray = Array.isArray(data) ? data : data.skills || data.results || [];
      if (skillsArray.length > 0) {
        setTopicSuggestions(skillsArray);
        setShowTopicSuggestions(true);
      } else {
        setTopicSuggestions([]);
        setShowTopicSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching topic suggestions:", error);
      setTopicSuggestions([]);
      setShowTopicSuggestions(false);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const addTopicFromSuggestion = (topic) => {
    if (!selectedTopics.some((t) => t.skill_name?.toLowerCase() === topic.skill_name?.toLowerCase() || t.name?.toLowerCase() === topic.skill_name?.toLowerCase())) {
      setSelectedTopics([...selectedTopics, { id: topic.id, name: topic.skill_name }]);
    }
    setNewTopic("");
    setShowTopicSuggestions(false);
  };

  const handleAddTopic = (e) => {
    if (e.key === 'Enter' && newTopic.trim()) {
      const trimmed = newTopic.trim();
      const matched = topicSuggestions.find(
        (t) => t.skill_name.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched) {
        addTopicFromSuggestion(matched);
      } else {
        if (!selectedTopics.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
          setSelectedTopics([...selectedTopics, { id: Date.now().toString(), name: trimmed }]);
        }
        setNewTopic('');
        setShowTopicSuggestions(false);
      }
    }
  };

  const removeTopic = (id) => {
    setSelectedTopics(selectedTopics.filter(t => t.id !== id));
  };

  // --- Options ---
  const modes = ['MCQ', 'Coding Challenge', 'Mock Interview'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionCounts = [5, 10, 25];

  // --- Visibility toggles ---
  const showTopics = selectedMode !== 'Mock Interview' && selectedMode !== '';
  const showDifficulty = selectedMode !== 'Mock Interview' && selectedMode !== '';
  const showQuestionCount = selectedMode === 'MCQ';
  const showCustomInstructions = selectedMode !== 'Mock Interview' && selectedMode !== '';

  // --- Generate quiz ---
  const handleGenerate = async () => {
    if (!(selectedTopics.length > 0 && selectedDifficulty && selectedMode)) {
      setError('Please select all required fields.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const payload = {
        topics: selectedTopics.map(t => t.name),
        difficulty: selectedDifficulty,
        mode: selectedMode,
        question_count: selectedQuestionCount,
        custom_instruction: promptText,
      };

      const response = await api.post('/quiz/generate/', payload);
      navigate('/quiz-page', {
        state: { questions: response.data.questions }
      });
    } catch (err) {
      console.error('Failed to generate quiz:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate quiz. Please try again.';
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="quiz-app">
      <PageNavbar
        activePath="/quiz"
        navItems={[
          { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
          { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
        ]}
      />

      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          <div className="quiz-content-wrapper" style={{ paddingTop: '20px' }}>
            <div className="setup-container">
              <div className="setup-header">
                <h1>
                  <Sparkles size={28} color="#2563eb" style={{ display: 'inline-block', marginRight: '8px' }} />
                  Choose Your Challenge
                </h1>
                <p>Select the mode, topics, and difficulty to generate an AI‑powered quiz.</p>
              </div>

              <div className="setup-card">
                {/* MODE */}
                <div className="setup-section">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Zap size={18} color="#2563eb" />
                    Mode
                  </h3>
                  <div className="question-type-grid">
                    {modes.map((mode) => (
                      <div
                        key={mode}
                        className={`question-type-item ${selectedMode === mode ? 'selected' : ''}`}
                        onClick={() => setSelectedMode(mode)}
                      >
                        {mode}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider"></div>

                {/* TOPICS */}
                <div className={`slide-section ${showTopics ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="setup-section">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#2563eb" />
                        Select Topics
                      </h3>
                      <div className="skills-container">
                        {selectedTopics.length > 0 && (
                          <div className="skill-tags">
                            {selectedTopics.map((topic) => (
                              <span key={topic.id} className="skill-tag">
                                {topic.name}
                                <button
                                  type="button"
                                  className="skill-remove"
                                  onClick={() => removeTopic(topic.id)}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="skill-input-wrapper" ref={suggestionRef}>
                          <input
                            type="text"
                            placeholder="Type a topic and press Enter..."
                            value={newTopic}
                            onChange={(e) => {
                              setNewTopic(e.target.value);
                              if (e.target.value.trim().length === 0) {
                                setTopicSuggestions([]);
                                setShowTopicSuggestions(false);
                              }
                            }}
                            onKeyDown={handleAddTopic}
                            onFocus={() => {
                              // If input is non‑empty, always show suggestions:
                              // - If we have suggestions, show them.
                              // - If not, fetch immediately.
                              if (newTopic.trim().length >= 1) {
                                if (topicSuggestions.length > 0) {
                                  setShowTopicSuggestions(true);
                                } else {
                                  fetchTopicSuggestions(newTopic.trim());
                                }
                              }
                            }}
                          />
                          <Plus size={18} className="skill-input-icon" />
                          {showTopicSuggestions && (
                            <div className="skill-suggestions-dropdown">
                              {loadingSuggestions ? (
                                <div className="suggestion-loading">Loading...</div>
                              ) : (
                                topicSuggestions.map((topic) => (
                                  <div
                                    key={topic.id}
                                    className="suggestion-item"
                                    onClick={() => addTopicFromSuggestion(topic)}
                                  >
                                    <span className="suggestion-name">{topic.skill_name}</span>
                                    {topic.category && <span className="suggestion-category">{topic.category}</span>}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* DIFFICULTY */}
                <div className={`slide-section ${showDifficulty ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="divider"></div>
                    <div className="setup-section">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Gauge size={18} color="#2563eb" />
                        Difficulty Level
                      </h3>
                      <div className="difficulty-grid">
                        {difficulties.map((diff) => (
                          <div
                            key={diff}
                            className={`difficulty-item ${selectedDifficulty === diff ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty(diff)}
                          >
                            <span className={`difficulty-dot ${diff.toLowerCase()}`}></span>
                            <span>{diff}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* QUESTION COUNT */}
                <div className={`slide-section ${showQuestionCount ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="divider"></div>
                    <div className="setup-section">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ListChecks size={18} color="#2563eb" />
                        Number of Questions
                      </h3>
                      <div className="difficulty-grid">
                        {questionCounts.map((count) => (
                          <div
                            key={count}
                            className={`difficulty-item ${selectedQuestionCount === count ? 'selected' : ''}`}
                            onClick={() => setSelectedQuestionCount(count)}
                          >
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CUSTOM INSTRUCTIONS */}
                <div className={`slide-section ${showCustomInstructions ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="divider"></div>
                    <div className="setup-section">
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={18} color="#2563eb" />
                        Custom Instructions (Optional)
                      </h3>
                      <div className="prompt-box-wrapper">
                        <textarea
                          className="prompt-box-textarea"
                          placeholder="e.g. Focus on dynamic programming and graph algorithms..."
                          value={promptText}
                          onChange={(e) => setPromptText(e.target.value)}
                          rows="3"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="field-error" style={{ marginTop: '16px', marginBottom: '0' }}>
                    <AlertCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    {error}
                  </div>
                )}

                {/* START BUTTON */}
                <button
                  className="start-quiz-btn"
                  onClick={handleGenerate}
                  disabled={!(selectedTopics.length > 0 && selectedDifficulty && selectedMode) || generating}
                >
                  {generating ? (
                    <>
                      <span className="spinner"></span> Generating...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} style={{ marginRight: '8px', color: 'white' }} />
                      Start
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Quiz;