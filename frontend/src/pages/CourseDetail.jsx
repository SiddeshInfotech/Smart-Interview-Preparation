import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  Lock,
  PlayCircle,
  Brain,
  Code,
  Users,
  Database,
  Terminal
} from 'lucide-react';
import '../styles/Courses.css';

// Courses Data Lookup
const COURSES_MAP = {
  'ds-algo-mastery': {
    id: 'ds-algo-mastery',
    title: 'Data Structures & Algorithms Mastery',
    description: 'Master arrays, trees, graphs, dynamic programming, and essential algorithms with real interview problems.',
    category: 'Computer Science',
    badge: 'Popular',
    level: 'Intermediate',
    duration: '24 Hours',
    totalModules: 12,
    completedModules: 8,
    progress: 67,
    gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    icon: <Brain size={24} />,
    modules: [
      { id: 1, title: 'Arrays, Strings & Two Pointers', duration: '2 hrs', status: 'completed' },
      { id: 2, title: 'Hash Maps & Linked Lists', duration: '2.5 hrs', status: 'completed' },
      { id: 3, title: 'Stacks, Queues & Priority Queues', duration: '3 hrs', status: 'completed' },
      { id: 4, title: 'Binary Trees & BST Traversals', duration: '3 hrs', status: 'in-progress' },
      { id: 5, title: 'Graph Algorithms & BFS/DFS', duration: '4 hrs', status: 'locked' },
      { id: 6, title: 'Dynamic Programming Patterns', duration: '5 hrs', status: 'locked' },
    ]
  },
  'system-design-pro': {
    id: 'system-design-pro',
    title: 'System Design & Scalable Architecture',
    description: 'Learn to design high-throughput distributed systems, load balancers, caching strategies, and database sharding.',
    category: 'System Design',
    badge: 'Advanced',
    level: 'Advanced',
    duration: '18 Hours',
    totalModules: 10,
    completedModules: 4,
    progress: 40,
    gradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
    icon: <Layers size={24} />,
    modules: [
      { id: 1, title: 'System Design Fundamentals & Trade-offs', duration: '2 hrs', status: 'completed' },
      { id: 2, title: 'Load Balancing & API Gateways', duration: '2 hrs', status: 'completed' },
      { id: 3, title: 'Caching Strategies (Redis & Memcached)', duration: '2.5 hrs', status: 'in-progress' },
      { id: 4, title: 'Database Replication & Sharding', duration: '3 hrs', status: 'locked' },
    ]
  },
  'fullstack-web-dev': {
    id: 'fullstack-web-dev',
    title: 'Full Stack Web Development',
    description: 'Comprehensive guide covering React, Node.js, Express, REST APIs, GraphQL, and modern web application deployment.',
    category: 'Web Dev',
    badge: 'Featured',
    level: 'Beginner to Intermediate',
    duration: '30 Hours',
    totalModules: 15,
    completedModules: 12,
    progress: 80,
    gradient: 'linear-gradient(135deg, #059669, #10b981)',
    icon: <Code size={24} />,
    modules: [
      { id: 1, title: 'Modern JavaScript ES6+ Essentials', duration: '3 hrs', status: 'completed' },
      { id: 2, title: 'React Fundamentals & Component Architecture', duration: '4 hrs', status: 'completed' },
      { id: 3, title: 'State Management & Custom Hooks', duration: '3.5 hrs', status: 'completed' },
      { id: 4, title: 'Node.js & Express RESTful APIs', duration: '4 hrs', status: 'in-progress' },
    ]
  },
  'hr-behavioral-mastery': {
    id: 'hr-behavioral-mastery',
    title: 'Behavioral & HR Interview Mastery',
    description: 'Structure STAR method responses, highlight leadership qualities, and craft compelling career narratives.',
    category: 'Interview Prep',
    badge: 'Essential',
    level: 'All Levels',
    duration: '8 Hours',
    totalModules: 6,
    completedModules: 6,
    progress: 100,
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    icon: <Users size={24} />,
    modules: [
      { id: 1, title: 'The STAR Method Framework', duration: '1.5 hrs', status: 'completed' },
      { id: 2, title: 'Handling Difficult Workplace Scenarios', duration: '1.5 hrs', status: 'completed' },
      { id: 3, title: 'Executive Presence & Communication', duration: '2 hrs', status: 'completed' },
    ]
  },
  'sql-database-mastery': {
    id: 'sql-database-mastery',
    title: 'Database Systems & SQL Optimization',
    description: 'Deep dive into relational databases, complex SQL queries, index optimization, transactions, and ACID properties.',
    category: 'Database',
    badge: 'Core',
    level: 'Intermediate',
    duration: '14 Hours',
    totalModules: 8,
    completedModules: 3,
    progress: 37.5,
    gradient: 'linear-gradient(135deg, #7c3aed, #c026d3)',
    icon: <Database size={24} />,
    modules: [
      { id: 1, title: 'SQL Querying & Joins Masterclass', duration: '2.5 hrs', status: 'completed' },
      { id: 2, title: 'Indexing & Query Performance Tuning', duration: '2.5 hrs', status: 'in-progress' },
      { id: 3, title: 'Database Normalization & ER Diagrams', duration: '2 hrs', status: 'locked' },
    ]
  },
  'python-ml-prep': {
    id: 'python-ml-prep',
    title: 'Python & Machine Learning Foundations',
    description: 'Essential Python libraries, Data Science fundamentals, NumPy, Pandas, Scikit-Learn, and ML interview concepts.',
    category: 'AI & Data',
    badge: 'Trending',
    level: 'Intermediate',
    duration: '22 Hours',
    totalModules: 11,
    completedModules: 1,
    progress: 10,
    gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    icon: <Terminal size={24} />,
    modules: [
      { id: 1, title: 'Python for Data Analysis & Scientific Computing', duration: '3 hrs', status: 'completed' },
      { id: 2, title: 'Exploratory Data Analysis with Pandas', duration: '3 hrs', status: 'in-progress' },
      { id: 3, title: 'Supervised Learning Algorithms', duration: '4 hrs', status: 'locked' },
    ]
  }
};

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const course = COURSES_MAP[courseId] || COURSES_MAP['ds-algo-mastery'];

  return (
    <div className="course-detail-container">
      {/* Back to Courses Link */}
      <button type="button" className="back-link-btn" onClick={() => navigate('/courses')}>
        <ArrowLeft size={18} />
        Back to Courses
      </button>

      {/* Course Hero Banner */}
      <div className="course-detail-hero">
        <div className="course-detail-header-tags">
          <span className="course-detail-badge">{course.badge}</span>
          <span className="course-detail-level">• {course.level}</span>
        </div>

        <h1 className="course-detail-title">{course.title}</h1>
        <p className="course-detail-description">{course.description}</p>

        {/* Stats Row */}
        <div className="course-detail-stats">
          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <Clock size={20} />
            </div>
            <div className="stat-info">
              <label>Duration</label>
              <span>{course.duration}</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <BookOpen size={20} />
            </div>
            <div className="stat-info">
              <label>Modules</label>
              <span>{course.totalModules} Lessons</span>
            </div>
          </div>

          <div className="stat-box">
            <div className="stat-icon-wrapper">
              <Award size={20} />
            </div>
            <div className="stat-info">
              <label>Progress</label>
              <span>{course.progress}% Completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules Overview Card */}
      <div className="course-detail-content-card">
        <h3 className="content-card-title">
          <Layers size={22} color="#4f46e5" />
          Course Curriculum & Modules
        </h3>

        <div className="module-list">
          {course.modules.map((mod) => (
            <div key={mod.id} className="module-item">
              <div className="module-info">
                <div className="module-number">{mod.id}</div>
                <div className="module-text">
                  <h4>{mod.title}</h4>
                  <p>Estimated time: {mod.duration}</p>
                </div>
              </div>

              <div className={`module-status ${mod.status}`}>
                {mod.status === 'completed' && (
                  <>
                    <CheckCircle2 size={18} />
                    <span>Completed</span>
                  </>
                )}
                {mod.status === 'in-progress' && (
                  <>
                    <PlayCircle size={18} />
                    <span>In Progress</span>
                  </>
                )}
                {mod.status === 'locked' && (
                  <>
                    <Lock size={18} />
                    <span>Upcoming</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
