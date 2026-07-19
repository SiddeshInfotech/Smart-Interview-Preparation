export default function Output({ result, loading, error }) {
  if (loading) {
    return (
      <div className="output output--loading">
        <span className="output__spinner" aria-hidden="true" />
        Running your code…
      </div>
    );
  }

  if (error) {
    return (
      <div className="output output--error">
        <div className="output__label">Request failed</div>
        <pre>{error}</pre>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="output output--empty">
        Run your code to see output here.
      </div>
    );
  }

  const isSuccess = result.status === "completed";

  return (
    <div className={`output ${isSuccess ? "output--success" : "output--error"}`}>
      <div className="output__meta">
        <span className={`output__status output__status--${result.status}`}>
          {result.judge0_status_description || result.status}
        </span>
        {result.execution_time && <span>{result.execution_time}s</span>}
        {result.memory_used != null && <span>{result.memory_used} KB</span>}
      </div>

      {result.stdout && (
        <div className="output__block">
          <div className="output__label">stdout</div>
          <pre>{result.stdout}</pre>
        </div>
      )}

      {result.compile_output && (
        <div className="output__block">
          <div className="output__label">compile output</div>
          <pre>{result.compile_output}</pre>
        </div>
      )}

      {result.stderr && (
        <div className="output__block">
          <div className="output__label">stderr</div>
          <pre>{result.stderr}</pre>
        </div>
      )}

      {!result.stdout && !result.stderr && !result.compile_output && (
        <div className="output__block output__block--muted">Program produced no output.</div>
      )}
    </div>
  );
}
