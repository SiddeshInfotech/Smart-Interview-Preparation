import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText, AlertCircle, Loader2 } from "lucide-react";
import { formatPdfUrl } from "../api/courseApi";
import "../styles/Courses.css";

export default function PdfViewerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const statePdfUrl = location.state?.pdfUrl || null;
  const pdfTitle = location.state?.pdfTitle || "Unit Study Material PDF";
  const moduleTitle = location.state?.moduleTitle || "Course Unit";
  const domainId = location.state?.domainId || null;

  const [pdfDisplayUrl, setPdfDisplayUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formattedRawUrl = formatPdfUrl(statePdfUrl);

  useEffect(() => {
    let active = true;
    let createdBlobUrl = null;

    if (!formattedRawUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fast direct blob fetch to bypass iframe cross-origin negotiation
    fetch(formattedRawUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        if (active) {
          const pdfBlob = new Blob([blob], { type: "application/pdf" });
          createdBlobUrl = URL.createObjectURL(pdfBlob);
          setPdfDisplayUrl(createdBlobUrl);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Direct blob fetch failed, falling back to URL:", err);
        if (active) {
          const fallbackUrl = formattedRawUrl.includes("#")
            ? formattedRawUrl
            : `${formattedRawUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
          setPdfDisplayUrl(fallbackUrl);
          setLoading(false);
        }
      });

    return () => {
      active = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
      }
    };
  }, [formattedRawUrl]);

  const handleBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { state: { domainId } });
    } else {
      navigate("/courses");
    }
  };

  if (!formattedRawUrl) {
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

      {/* PDF Viewport Container */}
      <div style={{ flex: 1, width: "100%", height: "calc(100vh - 64px)", background: "#1e293b", position: "relative" }}>
        {loading ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#94a3b8",
              gap: "12px"
            }}
          >
            <Loader2 size={36} className="spin" color="#818cf8" />
            <p style={{ fontSize: "0.95rem", fontWeight: "500" }}>Opening document...</p>
          </div>
        ) : (
          <object
            data={pdfDisplayUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            style={{ width: "100%", height: "100%", border: "none" }}
          >
            <iframe
              src={pdfDisplayUrl}
              title={pdfTitle}
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                background: "#ffffff"
              }}
            />
          </object>
        )}
      </div>
    </div>
  );
}
