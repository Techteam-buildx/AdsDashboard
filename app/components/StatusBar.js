// Error / partial-data notices shown under the filters.
class StatusBar extends React.Component {
  render() {
    const { error, warnings, onRetry } = this.props;
    if (error) {
      return (
        <div className="notice notice-error" role="alert">
          <span className="notice-icon" aria-hidden="true">!</span>
          <span className="notice-text">{error}</span>
          <button className="btn" onClick={onRetry}>Retry</button>
        </div>
      );
    }
    if (warnings && warnings.length) {
      return (
        <div className="notice notice-warning" role="status">
          <span className="notice-icon" aria-hidden="true">!</span>
          <span className="notice-text">Some data may be incomplete: {warnings.join(" · ")}</span>
          <button className="btn" onClick={onRetry}>Retry</button>
        </div>
      );
    }
    return null;
  }
}

function formatAsOf(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
