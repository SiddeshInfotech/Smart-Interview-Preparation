import React from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Download, ExternalLink, FileText, AlertCircle } from "lucide-react";
import "../styles/Courses.css";

export default function PdfViewerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const pdfUrl = location.state?.pdfUrl || null;
  const pdfTitle = location.state?.pdfTitle || "Unit Study Material PDF";
  const moduleTitle = location.state?.moduleTitle || "Course Unit";
  const domainId = location.state?.domainId || null;

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
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
        maxHeight: "100vh",
        background: "#0f172a",
        margin: "-16px -24px",
        overflow: "hidden"
      }}
    >
      {/* PDF Header Toolbar */}
      <div
        style={{
          background: "#0f172a",
          color: "#ffffff",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 10
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

        {/* Center: Title */}
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
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            {pdfTitle}
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <a
            href={pdfUrl}
            download
            style={{
              background: "#4f46e5",
              color: "#ffffff",
              padding: "8px 14px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(79, 70, 229, 0.3)"
            }}
          >
            <Download size={16} />
            <span>Download PDF</span>
          </a>

          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open PDF in external browser tab"
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#cbd5e1",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              padding: "8px 12px",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.85rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* PDF Viewport */}
      <div style={{ flex: 1, width: "100%", height: "100%", background: "#1e293b" }}>
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

