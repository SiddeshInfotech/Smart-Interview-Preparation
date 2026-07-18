import React, { useState } from "react";
import "../styles/FeedbackForm.css";
import { submitFeedback } from "../api/feedbackAPI";

const FeedbackForm = () => {

  const [feedback, setFeedback] = useState({
    name: "",
    email: "",
    overallExperience: "",
    mockInterview: "",
    suggestions: "",
    recommend: "",
    recommendationReason: ""
  });


  const handleChange = (e) => {
    setFeedback({
      ...feedback,
      [e.target.name]: e.target.value
    });
  };


  const handleSubmit = async (e) => {

  e.preventDefault();

  try {

    const response = await submitFeedback(feedback);

    console.log("Feedback Response:", response.data);

    alert("Thank you for your feedback!");


    setFeedback({
      name: "",
      email: "",
      overallExperience: "",
      mockInterview: "",
      suggestions: "",
      recommend: "",
      recommendationReason: ""
    });


  } catch (error) {

    console.log(
      "Feedback Error:",
      error.response?.data || error.message
    );

    alert("Failed to submit feedback");

  }

};

  return (
    <div className="feedback-page">
      <div className="feedback-container">

        <div className="feedback-header">

          <h1>
            Portal Feedback
          </h1>

          <p>
            Share your experience with PrepMaster AI and help us improve the platform.
          </p>

        </div>


        <form 
          className="feedback-form"
          onSubmit={handleSubmit}
        >


          <div className="form-row">


            <div className="form-group">

              <label>
                Name
              </label>

              <input
                type="text"
                name="name"
                value={feedback.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />

            </div>



            <div className="form-group">

              <label>
                Email
              </label>

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

            <label>
              Overall Experience
            </label>


            <select
              name="overallExperience"
              value={feedback.overallExperience}
              onChange={handleChange}
            >

              <option value="">
                Select Rating
              </option>

              <option>
                Excellent
              </option>

              <option>
                Good
              </option>

              <option>
                Average
              </option>

              <option>
                Poor
              </option>

            </select>

          </div>



          <div className="form-group">

            <label>
              Mock Interview Experience
            </label>


            <textarea
              name="mockInterview"
              value={feedback.mockInterview}
              onChange={handleChange}
              placeholder="Share your experience with Mock Interview feature"
              rows="4"
            />

          </div>
                    <div className="form-group">

            <label>
              Suggestions for Improvement
            </label>


            <textarea
              name="suggestions"
              value={feedback.suggestions}
              onChange={handleChange}
              placeholder="Enter your suggestions to improve PrepMaster AI"
              rows="4"
            />

          </div>



          <div className="form-group">

            <label>
              Would you recommend PrepMaster AI?
            </label>


            <select
              name="recommend"
              value={feedback.recommend}
              onChange={handleChange}
            >

              <option value="">
                Select Option
              </option>

              <option>
                Yes
              </option>

              <option>
                No
              </option>

            </select>

          </div>



          {
            feedback.recommend && (

              <div className="form-group">

                <label>
                  {
                    feedback.recommend === "Yes"
                    ? "Why would you recommend our portal?"
                    : "Why would you not recommend our portal?"
                  }
                </label>


                <textarea
                  name="recommendationReason"
                  value={feedback.recommendationReason}
                  onChange={handleChange}
                  placeholder={
                    feedback.recommend === "Yes"
                    ? "Tell us the reason for recommending PrepMaster AI"
                    : "Tell us what improvements are needed"
                  }
                  rows="4"
                />

              </div>

            )
          }



          <button 
            type="submit" 
            className="submit-btn"
          >
            Submit Feedback
          </button>



        </form>


      </div>


    </div>
  );

};

export default FeedbackForm;
