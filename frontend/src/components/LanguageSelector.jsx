export default function LanguageSelector({ languages, value, onChange }) {
  return (
    <div className="language-selector">
      <label htmlFor="language-select">Language</label>
      <select
        id="language-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {languages.map((lang) => (
          <option key={lang.value} value={lang.value}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
