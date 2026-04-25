export default function MonthNav({ label, isCurrentMonth, onPrev, onNext }) {
  return (
    <div className="month-nav">
      <button className="month-nav-btn" onClick={onPrev}>&larr;</button>
      <span className="month-nav-label">{label}</span>
      <button
        className="month-nav-btn"
        onClick={onNext}
        disabled={isCurrentMonth}
      >
        &rarr;
      </button>
    </div>
  );
}
