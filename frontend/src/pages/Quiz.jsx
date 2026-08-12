import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  MessageSquare,
  ArrowRight,
  Zap,
  AlertCircle,
  Code2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import api from '../api/axios';
import { fetchCourseBootstrap } from '../api/courseApi';
import '../styles/Quiz.css';

const cleanCourseTitle = (title) => {
  if (!title) return "";
  return title
    .replace(/\s*Masterclass\s*/gi, " ")
    .replace(/\s*Notes?\s*/gi, " ")
    .replace(/&\s*&/g, "&")
    .replace(/\s+/g, " ")
    .trim();
};

const DOMAIN_TOPICS = {
  'Web Development': ['React JS', 'HTML & CSS', 'Python & Django'],
  'Full Stack Domain': ['React JS', 'HTML & CSS', 'Python & Django'],
  'Mobile Development': ['React Native', 'Flutter', 'Kotlin & Android', 'Swift'],
  'Android Development': ['Kotlin & Android', 'Java Programming'],
  'Data Science / Analytics': ['Python Programming', 'Data Analysis', 'Machine Learning', 'SQL'],
  'Data Analysis': ['Python Programming', 'Data Analysis', 'SQL'],
  'Cybersecurity': ['Network Security', 'Ethical Hacking', 'Linux Security'],
  'Game Development': ['C++ Game Development', 'C# Unity', 'Physics & Graphics'],
  'Software Testing / QA': ['Software Testing', 'Selenium & Automation', 'API Testing'],
  'Software Testing': ['Software Testing', 'Selenium & Automation'],
  'UI/UX / HCI': ['UI/UX Design Systems', 'User Research', 'Figma Prototyping'],
};

const Quiz = () => {
  const navigate = useNavigate();

  // Candidate Domain & Course State
  const [candidateDomain, setCandidateDomain] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  
  // Configuration state
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedMode, setSelectedMode] = useState('MCQ');
  const [selectedCodingLanguage, setSelectedCodingLanguage] = useState('Python');
  const [promptText, setPromptText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Fetch candidate profile domain and domain courses on load
  useEffect(() => {
    const loadDomainAndCourses = async () => {
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

      try {
        const res = await fetchCourseBootstrap();
        if (res.data?.courses && Array.isArray(res.data.courses)) {
          const courseTitles = res.data.courses
            .map((c) => cleanCourseTitle(c.title))
            .filter(Boolean);
          if (courseTitles.length > 0) {
            setAvailableCourses(courseTitles);
          }
        }
      } catch (e) {
        console.warn("Could not fetch domain courses for quiz topics:", e);
      }
    };
    loadDomainAndCourses();
  }, []);

  const getDomainTopics = (domainName) => {
    if (!domainName) return DOMAIN_TOPICS['Web Development'];
    const norm = domainName.trim();
    if (DOMAIN_TOPICS[norm]) {
      return DOMAIN_TOPICS[norm];
    }
    const lower = norm.toLowerCase();
    if (lower.includes('web') || lower.includes('full stack')) return DOMAIN_TOPICS['Web Development'];
    if (lower.includes('data')) return DOMAIN_TOPICS['Data Science / Analytics'];
    if (lower.includes('test') || lower.includes('qa')) return DOMAIN_TOPICS['Software Testing / QA'];
    if (lower.includes('mobile') || lower.includes('android')) return DOMAIN_TOPICS['Mobile Development'];
    if (lower.includes('cyber') || lower.includes('security')) return DOMAIN_TOPICS['Cybersecurity'];
    if (lower.includes('game')) return DOMAIN_TOPICS['Game Development'];
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('design')) return DOMAIN_TOPICS['UI/UX / HCI'];
    return DOMAIN_TOPICS['Web Development'];
  };

  const DOMAIN_CODING_LANGUAGES = {
    'Web Development': ['React JS', 'JavaScript', 'HTML CSS', 'Python + Django'],
    'Full Stack Domain': ['React JS', 'JavaScript', 'HTML CSS', 'Python + Django'],
    'Data Analysis': ['Python', 'SQL'],
    'Data Science / Analytics': ['Python', 'SQL'],
    'Software Testing': ['Python', 'JavaScript', 'Software Testing'],
    'Software Testing / QA': ['Python', 'JavaScript', 'Software Testing'],
    'Mobile Development': ['React Native', 'Kotlin', 'Java', 'Swift'],
    'Android Development': ['Java', 'Kotlin'],
    'Cybersecurity': ['Python', 'C / C++', 'Bash Shell'],
    'Game Development': ['C++', 'C#', 'Python'],
    'UI/UX / HCI': ['HTML CSS', 'JavaScript', 'Design Systems']
  };

  const getDomainLanguages = (domainName) => {
    if (!domainName) return ['React JS', 'JavaScript', 'HTML CSS', 'Python + Django'];
    const norm = domainName.trim();
    if (DOMAIN_CODING_LANGUAGES[norm]) {
      return DOMAIN_CODING_LANGUAGES[norm];
    }
    const lower = norm.toLowerCase();
    if (lower.includes('web') || lower.includes('full stack')) {
      return ['React JS', 'JavaScript', 'HTML CSS', 'Python + Django'];
    }
    if (lower.includes('data')) {
      return ['Python', 'SQL'];
    }
    if (lower.includes('test') || lower.includes('qa')) {
      return ['Python', 'JavaScript', 'Software Testing'];
    }
    if (lower.includes('mobile') || lower.includes('android')) {
      return ['React Native', 'Kotlin', 'Java', 'Swift'];
    }
    if (lower.includes('cyber') || lower.includes('security')) {
      return ['Python', 'C / C++', 'Bash Shell'];
    }
    if (lower.includes('game')) {
      return ['C++', 'C#', 'Python'];
    }
    if (lower.includes('ui') || lower.includes('ux') || lower.includes('design')) {
      return ['HTML CSS', 'JavaScript', 'Design Systems'];
    }
    return ['React JS', 'JavaScript', 'HTML CSS', 'Python + Django'];
  };

  const modes = ['MCQ', 'Coding Challenge'];
  const domainTopics = availableCourses.length > 0 ? availableCourses : getDomainTopics(candidateDomain);
  const codingLanguages = getDomainLanguages(candidateDomain);

  useEffect(() => {
    const allowedLangs = getDomainLanguages(candidateDomain);
    if (!allowedLangs.includes(selectedCodingLanguage)) {
      setSelectedCodingLanguage(allowedLangs[0] || 'Python');
    }

    const currentTopics = availableCourses.length > 0 ? availableCourses : getDomainTopics(candidateDomain);
    if (!currentTopics.includes(selectedTopic)) {
      setSelectedTopic(currentTopics[0] || '');
    }
  }, [candidateDomain, availableCourses]);

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
    setError('');
    setGenerating(true);

    try {
      const activeTopic = selectedTopic || domainTopics[0] || (candidateDomain || "Web Development");
      const payload = {
        topics: [activeTopic],
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
                <p>AI-driven interview assessment dynamically tailored to your profile context.</p>
                <div className="quiz-header-line" />
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
                        <span style={{ fontSize: '0.78rem', color: '#6366f1', marginLeft: '8px', fontWeight: 500 }}>
                          (Filtered for {candidateDomain || 'Web Development'} Domain)
                        </span>
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
                        Domain Topic
                        <span style={{ fontSize: '0.78rem', color: '#6366f1', marginLeft: '8px', fontWeight: 500 }}>
                          (Filtered for {candidateDomain || 'Web Development'} Domain)
                        </span>
                      </h3>
                      <div className="language-select-container">
                        <select
                          className="language-select-dropdown"
                          value={selectedTopic}
                          onChange={(e) => setSelectedTopic(e.target.value)}
                        >
                          {domainTopics.map((topic) => (
                            <option key={topic} value={topic}>
                              {topic}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </div>

                <div className="divider"></div>

                {/* CUSTOM INSTRUCTION PROMPT */}
                <div className="setup-section">
                  <h3 className="section-title">
                    <MessageSquare size={18} className="section-icon" />
                    Custom Instruction <span className="optional-badge">(Optional)</span>
                  </h3>
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
