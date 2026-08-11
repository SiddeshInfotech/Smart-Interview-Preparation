import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, AlertCircle } from "lucide-react";
import { formatPdfUrl } from "../api/courseApi";
import "../styles/Courses.css";


export default function PdfViewerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const statePdfUrl = location.state?.pdfUrl || null;
  const formattedRawUrl = formatPdfUrl(statePdfUrl);
  const pdfTitle = location.state?.pdfTitle || "Unit Study Material PDF";
  const moduleTitle = location.state?.moduleTitle || "Course Unit";
  const domainId = location.state?.domainId || null;

  // Append viewer parameters for fast streaming and width fitting
  const pdfUrl = formattedRawUrl
    ? (formattedRawUrl.includes("#") ? formattedRawUrl : `${formattedRawUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`)
    : null;


  const handleBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { state: { domainId } });
    } else {
      navigate("/courses");
    }
  };

  if (!pdfUrl) {
    return (
      <div className="course-detail-container" style={{ padding: "40px 20px" }}>
        <button type="button" className="back-link-btn" onClick={handleBack}>
          <ArrowLeft size={18} />
          Back to Course Modules
        </button>

        <div className="courses-error-state" style={{ marginTop: "30px" }}>
          <AlertCircle size={44} color="#ef4444" />
          <h3>PDF Document Not Found</h3>
          <p>No valid PDF document URL was provided for this unit.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: "#0f172a",
        overflow: "hidden"
      }}
    >
      {/* Fixed Header Toolbar Navbar */}
      <div
        style={{
          height: "64px",
          background: "#0f172a",
          color: "#ffffff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          flexShrink: 0
        }}
      >
        {/* Left: Back Button */}
        <button
          type="button"
          onClick={handleBack}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "0.875rem",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease"
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Modules</span>
        </button>

        {/* Center: Title Only */}
        <div style={{ textAlign: "center", padding: "0 16px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "1.1rem",
              fontWeight: "700",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <FileText size={18} color="#818cf8" />
            {moduleTitle}
          </h2>
        </div>

        {/* Right: Spacer to keep title centered */}
        <div style={{ width: "150px" }} />
      </div>

      {/* Instant PDF Viewport Container */}
      <div style={{ flex: 1, width: "100%", height: "calc(100vh - 64px)", background: "#1e293b" }}>
        <object
          data={pdfUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          style={{ width: "100%", height: "100%", border: "none" }}
        >
          <iframe
            src={pdfUrl}
            title={pdfTitle}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "#ffffff"
            }}
          />
        </object>
      </div>
    </div>
  );
}
