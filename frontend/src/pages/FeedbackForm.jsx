import React, { useState } from "react";
import { LayoutDashboard, ClipboardList, FileText, CalendarClock } from "lucide-react";
import PageNavbar from "../components/PageNavbar.jsx";
import "../styles/FeedbackForm.css";

const FeedbackForm = () => {

  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    overallExperience: "",
    resumeManager: "",
    mockInterview: "",
    codingAssessment: "",
    aptitudeTest: "",
    dashboardExperience: "",
    suggestions: "",
    comments: "",
    recommend: ""
  });

  const handleChange = (e) => {
    setFeedback({
      ...feedback,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(feedback);
    alert("Thank you for your feedback!");
  };

  return (
    <div className="feedback-page">
      <PageNavbar
        activePath="/feedback"
        navItems={[
          { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
          { to: "/quiz", label: "Practice Mode", icon: <ClipboardList size={18} /> },
          { to: "/resume-upload", label: "Resume Analysis", icon: <FileText size={18} /> },
          { to: "/interview", label: "Interview", icon: <CalendarClock size={18} /> },
        ]}
      />

      <div className="feedback-container">
        <div className="feedback-header">
          <h1>Portal Feedback</h1>
          <p>
            Share your experience with PrepMaster AI and help us improve the platform.
          </p>
        </div>

        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={feedback.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={feedback.email}
                onChange={handleChange}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Overall Experience</label>
            <select
              name="overallExperience"
              value={feedback.overallExperience}
              onChange={handleChange}
            >
              <option value="">Select Rating</option>
              <option>Excellent</option>
              <option>Good</option>
              <option>Average</option>
              <option>Poor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Resume Manager Experience</label>
            <textarea
              name="resumeManager"
              value={feedback.resumeManager}
              onChange={handleChange}
              placeholder="Share your experience with Resume Manager feature"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Mock Interview Experience</label>
            <textarea
              name="mockInterview"
              value={feedback.mockInterview}
              onChange={handleChange}
              placeholder="Share your experience with Mock Interview feature"
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Coding Assessment Experience</label>
              <select
                name="codingAssessment"
                value={feedback.codingAssessment}
                onChange={handleChange}
              >
                <option value="">Select Rating</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label>Aptitude Test Experience</label>
              <select
                name="aptitudeTest"
                value={feedback.aptitudeTest}
                onChange={handleChange}
              >
                <option value="">Select Rating</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Average</option>
                <option>Poor</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Dashboard Experience</label>
            <select
              name="dashboardExperience"
              value={feedback.dashboardExperience}
              onChange={handleChange}
            >
              <option value="">Select Rating</option>
              <option>Excellent</option>
              <option>Good</option>
              <option>Average</option>
              <option>Poor</option>
            </select>
          </div>

          <div className="form-group">
            <label>Suggestions for Improvement</label>
            <textarea
              name="suggestions"
              value={feedback.suggestions}
              onChange={handleChange}
              placeholder="Enter your suggestions"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Additional Comments</label>
            <textarea
              name="comments"
              value={feedback.comments}
              onChange={handleChange}
              placeholder="Enter additional comments"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Would you recommend PrepMaster AI?</label>
            <select
              name="recommend"
              value={feedback.recommend}
              onChange={handleChange}
            >
              <option value="">Select Option</option>
              <option>Yes</option>
              <option>No</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;