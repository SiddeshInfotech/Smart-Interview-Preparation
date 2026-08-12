import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { formatPdfUrl } from "../api/courseApi";
import "../styles/Courses.css";

// Configure worker URL from cdnjs for lightweight background rendering
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function PdfViewerPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const statePdfUrl = location.state?.pdfUrl || null;
  const pdfTitle = location.state?.pdfTitle || "Unit Study Material PDF";
  const moduleTitle = location.state?.moduleTitle || "Course Unit";
  const domainId = location.state?.domainId || null;

  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const formattedRawUrl = formatPdfUrl(statePdfUrl);

  const handleBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { state: { domainId } });
    } else {
      navigate("/courses");
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (!formattedRawUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadingTask = pdfjsLib.getDocument({
      url: formattedRawUrl,
      cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
      cMapPacked: true,
    });

    loadingTask.promise
      .then((doc) => {
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("PDF.js loading error:", err);
        if (!isCancelled) {
          setError("Failed to load PDF document.");
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [formattedRawUrl]);

  // Render pages to canvas when pdfDoc or scale changes
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    let isCancelled = false;
    const container = containerRef.current;
    container.innerHTML = "";

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (isCancelled) break;

        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 20px auto";
          canvas.style.borderRadius = "8px";
          canvas.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
          canvas.style.background = "#ffffff";

          const pageWrapper = document.createElement("div");
          pageWrapper.style.position = "relative";
          pageWrapper.style.display = "flex";
          pageWrapper.style.justifyContent = "center";
          pageWrapper.appendChild(canvas);

          if (container && !isCancelled) {
            container.appendChild(pageWrapper);
          }

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };
          await page.render(renderContext).promise;
        } catch (err) {
          console.error(`Error rendering PDF page ${pageNum}:`, err);
        }
      }
    };

    renderAllPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, scale]);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2.5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.6));
  const resetZoom = () => setScale(1.25);

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
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
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

        {/* Center: Module Title */}
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

        {/* Right: Controls (Zoom & Page Count) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {numPages > 0 && (
            <span
              style={{
                fontSize: "0.825rem",
                fontWeight: "600",
                color: "#94a3b8",
                background: "rgba(255, 255, 255, 0.06)",
                padding: "5px 10px",
                borderRadius: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <BookOpen size={14} color="#818cf8" />
              {numPages} {numPages === 1 ? "Page" : "Pages"}
            </span>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              padding: "3px",
              border: "1px solid rgba(255, 255, 255, 0.12)"
            }}
          >
            <button
              type="button"
              onClick={zoomOut}
              title="Zoom Out"
              style={{
                background: "transparent",
                border: "none",
                color: "#e2e8f0",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ZoomOut size={16} />
            </button>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#e2e8f0", padding: "0 6px" }}>
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={zoomIn}
              title="Zoom In"
              style={{
                background: "transparent",
                border: "none",
                color: "#e2e8f0",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={resetZoom}
              title="Reset Zoom"
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                padding: "6px 8px",
                cursor: "pointer",
                borderRadius: "5px",
                display: "flex",
                alignItems: "center"
              }}
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Scroll Viewport */}
      <div
        style={{
          flex: 1,
          width: "100%",
          height: "calc(100vh - 64px)",
          background: "#1e293b",
          overflowY: "auto",
          padding: "24px 16px"
        }}
      >
        {loading && (
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
            <Loader2 size={38} className="spin" color="#818cf8" />
            <p style={{ fontSize: "0.95rem", fontWeight: "500" }}>Rendering document pages...</p>
          </div>
        )}

        {error && (
          <div className="courses-error-state" style={{ marginTop: "40px" }}>
            <AlertCircle size={40} color="#ef4444" />
            <h3>Unable to Display PDF</h3>
            <p>{error}</p>
          </div>
        )}

        <div ref={containerRef} style={{ width: "100%", minHeight: "100%" }} />
      </div>
    </div>
  );
}
