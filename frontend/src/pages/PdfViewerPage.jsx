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
  BookOpen,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import { formatPdfUrl, generateModuleQuiz } from "../api/courseApi";
import { getCachedPdfBuffer, prefetchPdf, fetchPdfArrayBuffer } from "../api/pdfCache";
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
  const moduleId = location.state?.moduleId || null;
  const isCompleted = location.state?.isCompleted || false;
  const courseTitle = location.state?.courseTitle || "";

  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  const containerRef = useRef(null);
  const formattedRawUrl = formatPdfUrl(statePdfUrl);

  const handleBack = () => {
    if (courseId) {
      navigate(`/courses/${courseId}`, { state: { domainId } });
    } else {
      navigate("/courses");
    }
  };

  const handleTakeQuiz = async () => {
    if (!moduleId) {
      alert("Module ID not found.");
      return;
    }
    setGeneratingQuiz(true);
    try {
      const res = await generateModuleQuiz(moduleId, moduleTitle, courseTitle);
      const questions = res.data?.questions || [];
      if (questions.length === 0) {
        alert("Failed to generate quiz questions for this unit.");
        return;
      }
      navigate("/quiz-page", {
        state: {
          questions,
          isUnitQuiz: true,
          moduleId: moduleId,
          courseId: courseId,
          domainId: domainId,
          unitTitle: moduleTitle,
          courseTitle: courseTitle,
          pdfUrl: formattedRawUrl,
          pdfTitle: pdfTitle,
        },
      });
    } catch (err) {
      console.error("Failed to generate unit quiz:", err);
      const msg = err.response?.data?.error || err.message || "Failed to generate AI quiz for this unit.";
      alert(msg);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  // 1. Fetch PDF Document (Using Native Resilient Buffer Fetch)
  useEffect(() => {
    let isCancelled = false;

    if (!formattedRawUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const loadPdfDoc = async () => {
      try {
        const buffer = await fetchPdfArrayBuffer(formattedRawUrl);
        if (isCancelled) return;

        if (!buffer || buffer.byteLength === 0) {
          throw new Error("Unable to fetch document bytes from any static or server source.");
        }

        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(buffer),
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (doc && !isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
        }
      } catch (err) {
        console.error("PDF load error:", err);
        if (!isCancelled) {
          setError("Failed to load PDF document.");
          setLoading(false);
        }
      }
    };

    loadPdfDoc();

    return () => {
      isCancelled = true;
    };
  }, [formattedRawUrl]);

  // 2. High-Performance Virtualized Page Renderer using IntersectionObserver
  useEffect(() => {
    if (!pdfDoc || !containerRef.current) return;

    let isCancelled = false;
    const container = containerRef.current;
    container.innerHTML = "";

    const activeRenderTasks = new Map();

    const renderPageToCanvas = async (pageNum, pageWrapper, canvas) => {
      if (isCancelled || pageWrapper.dataset.rendered === "true") return;
      pageWrapper.dataset.rendered = "rendering";

      try {
        const page = await pdfDoc.getPage(pageNum);
        if (isCancelled) return;

        const outputScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const ctx = canvas.getContext("2d");
        ctx.scale(outputScale, outputScale);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        activeRenderTasks.set(pageNum, renderTask);

        await renderTask.promise;
        pageWrapper.dataset.rendered = "true";
        activeRenderTasks.delete(pageNum);

        // Hide loading spinner as soon as Page 1 completes
        if (pageNum === 1) {
          setLoading(false);
        }
      } catch (err) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Page ${pageNum} render error:`, err);
        }
        pageWrapper.dataset.rendered = "false";
      }
    };

    const setupPages = async () => {
      try {
        // Get Page 1 viewport to calculate aspect ratio for smooth layout placeholders
        const page1 = await pdfDoc.getPage(1);
        const viewport1 = page1.getViewport({ scale });
        const height = viewport1.height;

        const pageWrappers = [];

        // Create DOM placeholders for all pages immediately
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const pageWrapper = document.createElement("div");
          pageWrapper.id = `pdf-page-wrapper-${i}`;
          pageWrapper.dataset.pageNum = i;
          pageWrapper.dataset.rendered = "false";
          pageWrapper.style.position = "relative";
          pageWrapper.style.display = "flex";
          pageWrapper.style.justifyContent = "center";
          pageWrapper.style.alignItems = "center";
          pageWrapper.style.marginBottom = "24px";
          pageWrapper.style.minHeight = `${height}px`;
          pageWrapper.style.width = "100%";

          const canvas = document.createElement("canvas");
          canvas.style.display = "block";
          canvas.style.borderRadius = "8px";
          canvas.style.boxShadow = "0 6px 20px rgba(0,0,0,0.35)";
          canvas.style.background = "#ffffff";

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);
          pageWrappers.push({ pageNum: i, wrapper: pageWrapper, canvas });
        }

        // Hide loading spinner immediately as DOM placeholders are ready
        setLoading(false);

        // Render Page 1 immediately for 0ms perceived delay
        if (pageWrappers[0]) {
          await renderPageToCanvas(1, pageWrappers[0].wrapper, pageWrappers[0].canvas);
        }

        // Use IntersectionObserver to render subsequent pages lazily when within 400px of viewport
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                const pNum = parseInt(entry.target.dataset.pageNum, 10);
                const targetObj = pageWrappers.find((p) => p.pageNum === pNum);
                if (targetObj && entry.target.dataset.rendered === "false") {
                  renderPageToCanvas(pNum, targetObj.wrapper, targetObj.canvas);
                }
              }
            });
          },
          {
            root: container.parentElement,
            rootMargin: "400px 0px 400px 0px",
            threshold: 0.01,
          }
        );

        pageWrappers.forEach((p) => observer.observe(p.wrapper));
      } catch (err) {
        console.error("Setup pages error:", err);
        setLoading(false);
      }
    };

    setupPages();

    return () => {
      isCancelled = true;
      activeRenderTasks.forEach((task) => {
        try {
          task.cancel();
        } catch (e) {}
      });
      activeRenderTasks.clear();
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
        <div style={{ textAlign: "center", padding: "0 16px", display: "flex", alignItems: "center", gap: "10px" }}>
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
          {isCompleted && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                backgroundColor: "#dcfce7",
                color: "#15803d",
                fontSize: "0.72rem",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "12px",
                border: "1px solid #86efac"
              }}
            >
              <CheckCircle2 size={12} color="#16a34a" /> Completed
            </span>
          )}
        </div>

        {/* Right: Controls (Quiz, Zoom & Page Count) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {moduleId && (
            <button
              type="button"
              onClick={handleTakeQuiz}
              disabled={generatingQuiz}
              style={{
                background: isCompleted ? "#047857" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#ffffff",
                border: "none",
                padding: "6px 14px",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: generatingQuiz ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 2px 8px rgba(124, 58, 237, 0.3)"
              }}
              title="Take 10-question AI Quiz for this unit"
            >
              {generatingQuiz ? (
                <>
                  <Loader2 size={15} className="spin" />
                  <span>Generating quiz from chapter material...</span>
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  <span>{isCompleted ? "Regenerate Quiz" : "Generate Quiz"}</span>
                </>
              )}
            </button>
          )}

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
