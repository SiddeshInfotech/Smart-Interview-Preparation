import React, { useState } from "react";
import PageNavbar from "../components/PageNavbar.jsx";
import "../styles/FeedbackForm.css";
import { submitFeedback } from "../api/feedbackAPI";


const FeedbackForm = () => {


const [feedback,setFeedback] = useState({

      name:"",
      email:"",

      overall_experience:"",
      mock_interview:"",

      coding_assessment: "",
      aptitude_test: "",

      suggestions:"",
      comments:"",

      recommend:"",
      recommendation_reason:""

});



  const [submittedFeedback, setSubmittedFeedback] = useState([]);



  const handleChange = (e) => {

    setFeedback({

      ...feedback,

      [e.target.name]: e.target.value

    });

  };





  const handleSubmit = async (e) => {

    e.preventDefault();


    try {


      await submitFeedback(feedback);



      setSubmittedFeedback([

        ...submittedFeedback,

        feedback

      ]);



      setFeedback({

        name: "",
        email: "",

        overall_experience: "",
        mock_interview: "",

        coding_assessment: "",
        aptitude_test: "",

        suggestions: "",
        comments: "",

        recommend: "",
        recommendation_reason: ""

});


      alert("Feedback Submitted Successfully");


    }

    catch(error){


      console.log(error);

      alert("Error submitting feedback");


    }


  };






  return (

    <>


      <PageNavbar />



      <div className="feedback-page">



        <div className="feedback-header">


          <h1>
            Feedback Form
          </h1>


          <p>
            Share your experience with our platform
          </p>


        </div>






        <div className="feedback-container">



          <form onSubmit={handleSubmit}>



            <div className="input-group">


              <label>
                Name
              </label>


              <input

                type="text"

                name="name"

                value={feedback.name}

                onChange={handleChange}

                placeholder="Enter your name"

                required

              />


            </div>






            <div className="input-group">


              <label>
                Email
              </label>


              <input

                type="email"

                name="email"

                value={feedback.email}

                onChange={handleChange}

                placeholder="Enter your email"

                required

              />


            </div>






            <div className="input-group">


              <label>
                Overall Experience
              </label>


              <select

                name="overall_experience"

                value={feedback.overall_experience}

                onChange={handleChange}

                required

              >


                <option value="">
                  Select Rating
                </option>


                <option value="Excellent">
                  Excellent
                </option>


                <option value="Good">
                  Good
                </option>


                <option value="Average">
                  Average
                </option>


                <option value="Poor">
                  Poor
                </option>



              </select>


            </div>






            <div className="input-group">


              <label>
                Mock Interview Experience
              </label>



              <select

                name="mock_interview"

                value={feedback.mock_interview}

                onChange={handleChange}

                required

              >


                <option value="">
                  Select Rating
                </option>


                <option value="Excellent">
                  Excellent
                </option>


                <option value="Good">
                  Good
                </option>


                <option value="Average">
                  Average
                </option>


                <option value="Poor">
                  Poor
                </option>


              </select>



            </div>
            <div className="input-group">

    <label>
        Coding Assessment Experience
    </label>


    <select

        name="coding_assessment"

        value={feedback.coding_assessment}

        onChange={handleChange}

        required

    >

        <option value="">
            Select Rating
        </option>

        <option value="Excellent">
            Excellent
        </option>

        <option value="Good">
            Good
        </option>

        <option value="Average">
            Average
        </option>

        <option value="Poor">
            Poor
        </option>


    </select>


</div>




          <div className="input-group">

    <label>
        Aptitude Test Experience
    </label>


    <select

        name="aptitude_test"

        value={feedback.aptitude_test}

        onChange={handleChange}

        required

    >

        <option value="">
            Select Rating
        </option>

        <option value="Excellent">
            Excellent
        </option>

        <option value="Good">
            Good
        </option>

        <option value="Average">
            Average
        </option>

        <option value="Poor">
            Poor
        </option>

    </select>

</div>


<div className="input-group">

    <label>
        Remarks
    </label>


              <textarea

                name="comments"

                value={feedback.comments}
                onChange={handleChange}

                placeholder="Share your suggestions or feedback..."

              />


            </div>








            <div className="input-group">


              <label>
                Would you recommend PrepMaster AI portal?
              </label>



              <select

                name="recommend"

                value={feedback.recommend}

                onChange={handleChange}

                required

              >


                <option value="">
                  Select Option
                </option>


                <option value="Yes">
                  Yes
                </option>


                <option value="No">
                  No
                </option>


              </select>


            </div>









            {

              feedback.recommend && (


                <div className="input-group">


                  <label>

                    {

                      feedback.recommend=== "Yes"

                      ? "Why would you recommend our portal?"

                      : "Why would you not recommend our portal?"

                    }


                  </label>



                  <textarea

                       name="recommendation_reason"

                       value={feedback.recommendation_reason}

                       onChange={handleChange}



                    placeholder={

                      feedback.recommend === "Yes"

                      ? "Tell us the reason..."

                      : "Tell us what we can improve..."

                    }


                    required


                  />



                </div>


              )

            }









            <button

              className="submit-btn"

              type="submit"

            >

              Submit Feedback


            </button>






          </form>




        </div>









        {

          submittedFeedback.length > 0 && (



            <div className="feedback-history">


              <h2>
                Previous Feedback
              </h2>





              {

                submittedFeedback.map((item,index)=>(


                  <div

                    className="feedback-item"

                    key={index}

                  >



                    <h3>
                      {item.name}
                    </h3>



                    <p>
                        Overall Experience: {item.overall_experience}
                    </p>


                    <p>
                         Mock Interview: {item.mock_interview}
                    </p>


                    <p>
                           Remarks: {item.comments}
                    </p>


                    <p>
                          Recommendation: {item.recommend}
                    </p>


                    <p>
                         Reason: {item.recommendation_reason}
                    </p>


                  </div>



                ))

              }





            </div>



          )


        }







      </div>



    </>


  );


};



export default FeedbackForm;