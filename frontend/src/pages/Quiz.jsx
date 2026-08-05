import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  Gauge,
  ListChecks,
  MessageSquare,
  ArrowRight,
  Zap,
  AlertCircle,
  Code2,
  HelpCircle,
  Flame,
  CheckCircle2
} from 'lucide-react';
import api from '../api/axios';
import '../styles/Quiz.css';

const SUGGESTED_CHIPS = [
  'JavaScript', 'React', 'Python', 'SQL', 'Data Structures', 'System Design'
];

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
  const [selectedCodingLanguage, setSelectedCodingLanguage] = useState('Python');
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
    if (!selectedTopics.some((t) => t.name?.toLowerCase() === topic.skill_name?.toLowerCase())) {
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

  const addSuggestedChip = (topicName) => {
    if (!selectedTopics.some((t) => t.name.toLowerCase() === topicName.toLowerCase())) {
      setSelectedTopics([...selectedTopics, { id: Date.now().toString() + topicName, name: topicName }]);
    }
  };

  // --- Options ---
  const modes = ['MCQ', 'Coding Challenge'];
  const codingLanguages = ['C', 'C++', 'Java', 'Python'];
  const difficulties = ['Easy', 'Medium', 'Hard'];
  const questionCounts = [10];

  // --- Visibility toggles ---
  const showTopics = selectedMode !== '';
  const showDifficulty = selectedMode !== '';
  const showQuestionCount = selectedMode === 'MCQ';
  const showCustomInstructions = selectedMode !== '';

  // --- Generate quiz / coding challenge ---
  const handleGenerate = async () => {
    if (selectedMode === 'Coding Challenge') {
      if (!selectedCodingLanguage || !selectedDifficulty) {
        setError('Please select language and difficulty level.');
        return;
      }
      setError('');
      setGenerating(true);
      try {
        const response = await api.post('/coding/generate/', {
          language: selectedCodingLanguage,
          difficulty: selectedDifficulty,
          custom_instruction: promptText,
        });
        navigate('/coding', {
          state: {
            language: selectedCodingLanguage,
            questionData: response.data?.data,
            difficulty: selectedDifficulty,
          }
        });
      } catch (err) {
        console.error('Failed to generate coding problem:', err);
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate coding problem.';
        setError(msg);
        navigate('/coding', {
          state: {
            language: selectedCodingLanguage,
            difficulty: selectedDifficulty,
          }
        });
      } finally {
        setGenerating(false);
      }
      return;
    }

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
      {/* Background Ambient Glows */}
      <div className="quiz-glow glow-1" />
      <div className="quiz-glow glow-2" />

      <div className="dashboard-page-container">
        <main className="dashboard-content-wrapper">
          <div className="quiz-content-wrapper" style={{ paddingTop: '10px' }}>
            <div className="setup-container">
              
              <div className="setup-header">
                <h1>
                  <span className="quiz-gradient-title">Choose Your Challenge</span>
                </h1>
                <p>Select the mode, topics, and difficulty to generate a practice arena.</p>
                <div className="quiz-header-line" />
              </div>

              <div className="setup-card">
                {/* MODE */}
                <div className="setup-section">
                  <h3 className="section-title">
                    <Zap size={18} className="section-icon" />
                    Practice Mode
                  </h3>
                  <div className="question-type-grid">
                    {modes.map((mode) => (
                      <div
                        key={mode}
                        className={`question-type-item ${selectedMode === mode ? 'selected' : ''}`}
                        onClick={() => setSelectedMode(mode)}
                      >
                        <span className="mode-icon-wrapper">
                          {mode === 'MCQ' ? <HelpCircle size={20} /> : <Code2 size={20} />}
                        </span>
                        <div className="mode-text-wrapper">
                          <strong>{mode}</strong>
                          <span>{mode === 'MCQ' ? 'Multiple choice assessment' : 'Interactive coding environment'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider"></div>

                {/* TOPICS / LANGUAGE */}
                <div className={`slide-section ${showTopics ? 'slide-enter-active' : 'slide-exit-active'}`} style={{ position: 'relative', zIndex: 100 }}>
                  <div className="slide-inner">
                    <div className="setup-section">
                      {selectedMode === 'Coding Challenge' ? (
                        <>
                          <h3 className="section-title">
                            <BookOpen size={18} className="section-icon" />
                            Select Programming Language
                          </h3>
                          <div className="language-select-container">
                            <select
                              className="language-select-dropdown"
                              value={selectedCodingLanguage}
                              onChange={(e) => setSelectedCodingLanguage(e.target.value)}
                            >
                              {codingLanguages.map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <h3 className="section-title">
                            <BookOpen size={18} className="section-icon" />
                            Select Topics & Technologies
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
                                placeholder="Type a topic (e.g. React, Python) and press Enter..."
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
                                  const query = newTopic.trim();
                                  if (topicSuggestions.length > 0 && query.length >= 1) {
                                    setShowTopicSuggestions(true);
                                  } else {
                                    fetchTopicSuggestions(query);
                                  }
                                }}
                              />
                              <Plus size={18} className="skill-input-icon" />
                              {showTopicSuggestions && (
                                <div className="skill-suggestions-dropdown">
                                  {loadingSuggestions ? (
                                    <div className="suggestion-loading">Loading suggestions...</div>
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

                            {/* Interactive Suggested Topic Chips */}
                            <div className="suggestions-hint">
                              <span className="hint-label"><Flame size={14} color="#f59e0b" /> Popular Topics:</span>
                              <div className="suggested-chips-row">
                                {SUGGESTED_CHIPS.map((chip) => {
                                  const isAdded = selectedTopics.some(t => t.name.toLowerCase() === chip.toLowerCase());
                                  return (
                                    <button
                                      type="button"
                                      key={chip}
                                      className={`suggested-chip-btn ${isAdded ? 'added' : ''}`}
                                      onClick={() => addSuggestedChip(chip)}
                                      disabled={isAdded}
                                    >
                                      {isAdded ? (
                                        <>
                                          <CheckCircle2 size={12} /> {chip}
                                        </>
                                      ) : (
                                        <>
                                          <Plus size={12} /> {chip}
                                        </>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* DIFFICULTY */}
                <div className={`slide-section ${showDifficulty ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="divider"></div>
                    <div className="setup-section">
                      <h3 className="section-title">
                        <Gauge size={18} className="section-icon" />
                        Difficulty Level
                      </h3>
                      <div className="difficulty-grid">
                        {difficulties.map((diff) => (
                          <div
                            key={diff}
                            className={`difficulty-item ${selectedDifficulty === diff ? 'selected' : ''}`}
                            onClick={() => setSelectedDifficulty(diff)}
                          >
                            <strong>{diff}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CUSTOM INSTRUCTION PROMPT */}
                <div className={`slide-section ${showCustomInstructions ? 'slide-enter-active' : 'slide-exit-active'}`}>
                  <div className="slide-inner">
                    <div className="divider"></div>
                    <div className="setup-section">
                      <h3 className="section-title">
                        <MessageSquare size={18} className="section-icon" />
                        Custom Focus Area <span className="optional-badge">(Optional)</span>
                      </h3>
                      <p className="section-description">
                        Provide specific instructions or topics to emphasize in your session (e.g. "Focus on async/await, closures, and performance optimization").
                      </p>
                      <textarea
                        className="custom-prompt-input"
                        placeholder="e.g., Focus heavily on memory management, edge cases, and architectural best practices..."
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div className="setup-action">
                  {error && (
                    <div className="error-banner">
                      <AlertCircle size={16} /> {error}
                    </div>
                  )}
                  <button
                    className={`btn-generate ${generating ? 'generating' : ''}`}
                    onClick={handleGenerate}
                    disabled={
                      generating ||
                      !selectedMode ||
                      !selectedDifficulty ||
                      (selectedMode === 'MCQ' && selectedTopics.length === 0) ||
                      (selectedMode === 'Coding Challenge' && !selectedCodingLanguage)
                    }
                  >
                    {generating ? (
                      <span className="spinner-wrapper">
                        <span className="spinner" /> Generating Practice Arena...
                      </span>
                    ) : (
                      <>
                        Start Practice Arena <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Quiz;
