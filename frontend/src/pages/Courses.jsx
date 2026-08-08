import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  ArrowRight,
  Code,
  Brain,
  Layers,
  Users,
  Database,
  Terminal,
  Sparkles,
  Edit3,
  UserCheck
} from 'lucide-react';
import '../styles/Courses.css';

// Master Course Database mapped by domains & keywords
const MASTER_COURSES = [
  {
    id: 'ds-algo-mastery',
    title: 'Data Structures & Algorithms Mastery',
    description: 'Master arrays, trees, graphs, dynamic programming, and essential algorithms with real interview problems.',
    domain: 'Data Structures & Algorithms',
    tags: ['dsa', 'data structures', 'algorithms', 'computer science', 'coding', 'cpp', 'java'],
    badge: 'Popular',
    level: 'Intermediate',
    duration: '24 Hours',
    totalModules: 12,
    completedModules: 8,
    progress: 67,
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    icon: <Brain size={24} />
  },
  {
    id: 'system-design-pro',
    title: 'System Design & Scalable Architecture',
    description: 'Learn to design high-throughput distributed systems, load balancers, caching strategies, and database sharding.',
    domain: 'System Design & Architecture',
    tags: ['system design', 'architecture', 'scalability', 'distributed systems', 'backend', 'cloud'],
    badge: 'Advanced',
    level: 'Advanced',
    duration: '18 Hours',
    totalModules: 10,
    completedModules: 4,
    progress: 40,
    gradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
    icon: <Layers size={24} />
  },
  {
    id: 'fullstack-web-dev',
    title: 'Full Stack Web Development',
    description: 'Comprehensive guide covering React, Node.js, Express, REST APIs, GraphQL, and modern web application deployment.',
    domain: 'Full Stack Web Development',
    tags: ['web dev', 'full stack', 'react', 'node', 'javascript', 'frontend', 'backend', 'html', 'css'],
    badge: 'Featured',
    level: 'Beginner to Intermediate',
    duration: '30 Hours',
    totalModules: 15,
    completedModules: 12,
    progress: 80,
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    icon: <Code size={24} />
  },
  {
    id: 'hr-behavioral-mastery',
    title: 'Behavioral & HR Interview Mastery',
    description: 'Structure STAR method responses, highlight leadership qualities, and craft compelling career narratives.',
    domain: 'Behavioral & HR Interview Mastery',
    tags: ['hr', 'behavioral', 'interview prep', 'communication', 'soft skills', 'star method'],
    badge: 'Essential',
    level: 'All Levels',
    duration: '8 Hours',
    totalModules: 6,
    completedModules: 6,
    progress: 100,
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    icon: <Users size={24} />
  },
  {
    id: 'sql-database-mastery',
    title: 'Database Systems & SQL Optimization',
    description: 'Deep dive into relational databases, complex SQL queries, index optimization, transactions, and ACID properties.',
    domain: 'Database Systems & SQL',
    tags: ['database', 'sql', 'postgresql', 'mysql', 'queries', 'data engineering'],
    badge: 'Core',
    level: 'Intermediate',
    duration: '14 Hours',
    totalModules: 8,
    completedModules: 3,
    progress: 37.5,
    gradient: 'linear-gradient(135deg, #7c3aed, #c026d3)',
    icon: <Database size={24} />
  },
  {
    id: 'python-ml-prep',
    title: 'Python & Machine Learning Foundations',
    description: 'Essential Python libraries, Data Science fundamentals, NumPy, Pandas, Scikit-Learn, and ML interview concepts.',
    domain: 'Python & Machine Learning',
    tags: ['python', 'machine learning', 'ai', 'data science', 'pandas', 'numpy', 'scikit-learn'],
    badge: 'Trending',
    level: 'Intermediate',
    duration: '22 Hours',
    totalModules: 11,
    completedModules: 1,
    progress: 10,
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    icon: <Terminal size={24} />
  }
];

export default function Courses() {
  const navigate = useNavigate();
  const [userDomain, setUserDomain] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('user-domain'); // 'user-domain' or 'all'

  // Load user domain from candidate profile / localStorage
  useEffect(() => {
    const savedDomain = localStorage.getItem("candidate_user_domain");
    if (savedDomain && savedDomain.trim()) {
      setUserDomain(savedDomain.trim());
    } else {
      try {
        const cachedProfile = localStorage.getItem("cached_candidate_profile");
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.target_domain || parsed.domain) {
            const dom = (parsed.target_domain || parsed.domain).trim();
            setUserDomain(dom);
            localStorage.setItem("candidate_user_domain", dom);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Generate courses based on user's target domain
  const getCoursesForUserDomain = () => {
    if (!userDomain) {
      return MASTER_COURSES;
    }

    const lowerDomain = userDomain.toLowerCase();
    
    // Check if domain matches any predefined master courses
    const matched = MASTER_COURSES.filter((course) => {
      const matchDomain = course.domain.toLowerCase().includes(lowerDomain) || lowerDomain.includes(course.domain.toLowerCase());
      const matchTags = course.tags.some(tag => lowerDomain.includes(tag) || tag.includes(lowerDomain));
      return matchDomain || matchTags;
    });

    if (matched.length > 0) {
      return matched;
    }

    // If candidate entered a custom domain, dynamically construct a dedicated course card for that domain!
    const customCourse = {
      id: `custom-domain-${userDomain.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: `${userDomain} Interview & Learning Hub`,
      description: `Comprehensive specialized modules, coding challenges, and interview preparation tailored specifically for ${userDomain}.`,
      domain: userDomain,
      badge: 'Custom Domain',
      level: 'All Levels',
      duration: '20 Hours',
      totalModules: 10,
      completedModules: 2,
      progress: 20,
      gradient: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
      icon: <Sparkles size={24} />
    };

    return [customCourse, ...MASTER_COURSES.slice(0, 3)];
  };

  const finalFilteredCourses = getCoursesForUserDomain();

  const handleGoToCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="courses-container">
      {/* Page Header (Matching Choose Your Challenge Header Style) */}
      <div className="setup-header">
        <h1>
          <span className="quiz-gradient-title">Domain Courses & Learning Hub</span>
        </h1>
        <p>Courses curated specifically based on your Candidate Profile domain preference.</p>
        <div className="quiz-header-line" />
      </div>

      {/* Candidate User Domain Alert Card */}
      <div className="courses-domain-banner">
        <div className="domain-banner-left">
          <div className="domain-banner-icon">
            <UserCheck size={18} />
          </div>
          <div>
            <div className="domain-banner-label">
              Your Target Domain
            </div>
            <div className="domain-banner-value">
              {userDomain ? userDomain : 'No Domain Set (Default View)'}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="btn-update-domain"
          onClick={() => navigate('/candidate-profile')}
        >
          <Edit3 size={14} />
          <span>{userDomain ? 'Update Domain in Profile' : 'Set Your Domain in Profile'}</span>
        </button>
      </div>

      {/* Course Cards Grid */}
      <div className="courses-grid">
        {finalFilteredCourses.length > 0 ? (
          finalFilteredCourses.map((course) => (
            <div key={course.id} className="course-card">
              {/* Card Header with Icon and Badge */}
              <div className="course-card-header">
                <div className="course-card-icon-badge" style={{ background: course.gradient }}>
                  {course.icon}
                </div>
                <span className="course-card-badge">{course.badge}</span>
              </div>

              {/* Course Title */}
              <h3 className="course-card-title">{course.title}</h3>

              {/* Progress Section */}
              <div className="course-progress-section">
                <div className="course-progress-header">
                  <span>Course Progress</span>
                  <span className="progress-percent">{course.progress}%</span>
                </div>
                <div className="course-progress-track">
                  <div
                    className="course-progress-fill"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Go to Course CTA */}
              <button
                type="button"
                className="btn-go-to-course"
                onClick={() => handleGoToCourse(course.id)}
                title="Go to Course page"
              >
                <span>Go to Course</span>
                <ArrowRight size={15} className="btn-arrow-icon" />
              </button>
            </div>
          ))
        ) : (
          <div className="courses-empty-state">
            <BookOpen size={48} color="#94a3b8" />
            <h3>No Courses Found</h3>
            <p>Try searching for a different keyword or update your domain in your Candidate Profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
