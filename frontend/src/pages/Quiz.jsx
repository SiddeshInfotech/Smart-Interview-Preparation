import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  BookOpen,
  MessageSquare,
  ArrowRight,
  Zap,
  AlertCircle,
  Code2,
  HelpCircle,
  Flame,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Target
} from 'lucide-react';
import api from '../api/axios';
import '../styles/Quiz.css';

const DOMAIN_TOPICS = {
  'Web Development': ['React', 'JavaScript', 'Node.js', 'REST APIs', 'HTML/CSS', 'Database / SQL'],
  'Mobile Development': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Mobile Architecture', 'REST APIs'],
  'Data Science / Analytics': ['Python', 'Pandas & NumPy', 'Machine Learning', 'SQL Data Warehouse', 'Statistics', 'Data Visualization'],
  'Cybersecurity': ['Network Security', 'Ethical Hacking', 'Cryptography', 'Web Application Security', 'SOC & Incident Response', 'Linux Administration'],
  'Game Development': ['C++', 'C#', 'OOP', 'Data Structures & Algorithms', 'Game Physics', 'Computer Graphics'],
  'Software Testing / QA': ['Automation Testing', 'Selenium & Cypress', 'Unit Testing', 'API Testing', 'Performance Testing', 'CI/CD Pipelines'],
  'UI/UX / HCI': ['User Research', 'Wireframing & Prototyping', 'Design Systems', 'Usability Testing', 'Information Architecture', 'Figma & Design Principles'],
};

const Quiz = () => {
  const navigate = useNavigate();

  // Candidate Domain State
  const [candidateDomain, setCandidateDomain] = useState('');
  
  // Configuration state
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [topicSuggestions, setTopicSuggestions] = useState([]);
  const [showTopicSuggestions, setShowTopicSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const suggestionRef = useRef(null);

  const [selectedMode, setSelectedMode] = useState('MCQ');
  const [selectedCodingLanguage, setSelectedCodingLanguage] = useState('Python');
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Fetch candidate profile domain on load
  useEffect(() => {
    const loadDomain = async () => {
      const cachedDomain = localStorage.getItem("candidate_user_domain");
      if (cachedDomain && cachedDomain.trim()) {
        setCandidateDomain(cachedDomain.trim());
      }
      try {
        const response = await api.get("/candidate/profile/");
        if (response.data?.target_domain) {
          const dom = response.data.target_domain.trim();
          setCandidateDomain(dom);
          localStorage.setItem("candidate_user_domain", dom);
        }
      } catch (err) {
        console.warn("Could not fetch candidate profile domain:", err);
      }
    };
    loadDomain();
  }, []);

  // Set suggested topic chips based on current active domain
  const currentSuggestedChips = DOMAIN_TOPICS[candidateDomain] || [
    'JavaScript', 'React', 'Python', 'SQL', 'Data Structures', 'System Design'
  ];

  // Topic suggestion dropdown outside click
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

  const DOMAIN_CODING_LANGUAGES = {
    'Web Development': ['HTML CSS', 'React JS', 'Python + Django'],
    'Full Stack Domain': ['HTML CSS', 'React JS', 'Python + Django'],
    'Data Analysis': ['Python', 'SQL'],
    'Data Science / Analytics': ['Python', 'SQL'],
    'Software Testing': ['Python', 'Software Testing'],
    'Software Testing / QA': ['Python', 'Software Testing'],
    'Mobile Development': ['React Native', 'Kotlin', 'Java'],
    'Android Development': ['Java', 'Kotlin'],
    'Cybersecurity': ['Python', 'C / C++', 'Bash Shell'],
    'Game Development': ['C++', 'C#', 'Python'],
    'UI/UX / HCI': ['HTML CSS', 'JavaScript', 'Design Systems']
  };

  const getDomainLanguages = (domainName) => {
    if (!domainName) return ['HTML CSS', 'React JS', 'Python + Django'];
    const norm = domainName.trim();
    if (DOMAIN_CODING_LANGUAGES[norm]) {
      return DOMAIN_CODING_LANGUAGES[norm];
    }
    const lower = norm.toLowerCase();
    if (lower.includes('web') || lower.includes('full stack')) {
      return ['HTML CSS', 'React JS', 'Python + Django'];
    }
    if (lower.includes('data')) {
      return ['Python', 'SQL'];
    }
    if (lower.includes('test') || lower.includes('qa')) {
      return ['Python', 'Software Testing'];
    }
    if (lower.includes('mobile') || lower.includes('android')) {
      return ['React Native', 'Kotlin', 'Java'];
    }
    if (lower.includes('cyber') || lower.includes('security')) {
      return ['Python', 'C / C++', 'Bash Shell'];
    }
    if (lower.includes('game')) {
      return ['C++', 'C#', 'Python'];
    }
    return ['HTML CSS', 'React JS', 'Python + Django'];
  };

  const modes = ['MCQ', 'Coding Challenge'];
  const codingLanguages = getDomainLanguages(candidateDomain);

  useEffect(() => {
    const allowed = getDomainLanguages(candidateDomain);
    if (!allowed.includes(selectedCodingLanguage)) {
      setSelectedCodingLanguage(allowed[0] || 'HTML CSS');
    }
  }, [candidateDomain]);

  // Handle single personalized generator
  const handleGenerate = async () => {
    if (selectedMode === 'Coding Challenge') {
      if (!selectedCodingLanguage) {
        setError('Please select your target programming language.');
        return;
      }
      setError('');
      setGenerating(true);
      try {
        const response = await api.post('/coding/generate/', {
          language: selectedCodingLanguage,
          custom_instruction: promptText,
        });
        navigate('/coding', {
          state: {
            language: selectedCodingLanguage,
            questionData: response.data?.data,
          }
        });
      } catch (err) {
        console.error('Failed to generate coding challenge:', err);
        const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to generate coding problem.';
        setError(msg);
      } finally {
        setGenerating(false);
      }
      return;
    }

    // MCQ Mode
    if (selectedTopics.length === 0 && !candidateDomain) {
      setError('Please select at least one topic or configure your career domain.');
      return;
    }

    setError('');
    setGenerating(true);

    try {
      const payload = {
        topics: selectedTopics.length > 0 ? selectedTopics.map(t => t.name) : [candidateDomain || "Web Development"],
        mode: 'MCQ',
        question_count: 10,
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
                  <span className="quiz-gradient-title">Personalized Preparation Arena</span>
                </h1>
                <p>AI-driven interview assessment dynamically tailored to your Career Domain and profile context.</p>
                <div className="quiz-header-line" />
              </div>

              {/* DOMAIN & PERSONALIZATION ENGINE BADGE */}
              <div className="domain-banner-card">
                <div className="domain-banner-left">
                  <div className="domain-banner-icon">
                    <Target size={22} />
                  </div>
                  <div>
                    <span className="domain-banner-label">
                      Primary Career Domain Context
                    </span>
                    <h3 className="domain-banner-title">
                      {candidateDomain ? candidateDomain : 'Web Development'}
                    </h3>
                  </div>
                </div>

                <div className="domain-banner-engine-badge">
                  <ShieldCheck size={16} color="#10b981" />
                  <span>
                    Auto-Adaptive Personalization Engine
                  </span>
                </div>
              </div>

              <div className="setup-card">
                {/* PRACTICE FORMAT */}
                <div className="setup-section">
                  <h3 className="section-title">
                    <Zap size={18} className="section-icon" />
                    Assessment Format
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
                          <strong>{mode === 'MCQ' ? 'Multiple Choice Assessment' : 'Interactive Coding Challenge'}</strong>
                          <span>{mode === 'MCQ' ? 'Comprehensive conceptual & technical question evaluation' : 'Live browser code editor with automated Piston execution'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="divider"></div>

                {/* TOPICS / LANGUAGE */}
                <div className="setup-section">
                  {selectedMode === 'Coding Challenge' ? (
                    <>
                      <h3 className="section-title">
                        <BookOpen size={18} className="section-icon" />
                        Target Programming Language
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
                        Domain Topics & Focus Areas
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
                            placeholder="Type a topic (e.g. React, Algorithms) and press Enter..."
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

                        {/* Interactive Domain Suggested Topic Chips */}
                        <div className="suggestions-hint">
                          <span className="hint-label"><Flame size={14} color="#f59e0b" /> Recommended for {candidateDomain || 'your domain'}:</span>
                          <div className="suggested-chips-row">
                            {currentSuggestedChips.map((chip) => {
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

                <div className="divider"></div>

                {/* CUSTOM INSTRUCTION PROMPT */}
                <div className="setup-section">
                  <h3 className="section-title">
                    <MessageSquare size={18} className="section-icon" />
                    Custom Focus Area <span className="optional-badge">(Optional)</span>
                  </h3>
                  <p className="section-description">
                    Specify key focus topics or concepts (e.g. "Focus heavily on asynchronous code, memory management, and system architecture").
                  </p>
                  <textarea
                    className="custom-prompt-input"
                    placeholder="e.g., Focus heavily on practical scenario questions, performance optimization, and architectural best practices..."
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    rows={3}
                  />
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
                    disabled={generating}
                  >
                    {generating ? (
                      <span className="spinner-wrapper">
                        <span className="spinner" /> Generating Personalized Assessment...
                      </span>
                    ) : (
                      <>
                        <Sparkles size={18} /> Generate Personalized Assessment <ArrowRight size={18} />
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
