// Shows which date range the numbers on screen belong to, when the lead data was
// last refreshed, and any load error / partial-data warning.
class StatusBar extends React.Component {
  formatTime(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  }

  render() {
    const { loading, error, warnings, loadedRange, dataAsOf, onRetry } = this.props;

    if (loading) {
      return <div style={{ ...barStyle, ...infoStyle }}>Loading data…</div>;
    }

    if (error) {
      return (
        <div style={{ ...barStyle, ...errorStyle }}>
          <span>{error}</span>
          <button style={buttonStyle} onClick={onRetry}>Retry</button>
        </div>
      );
    }

    return (
      <div style={{ width: "100%" }}>
        {loadedRange && (
          <div style={{ ...barStyle, ...infoStyle }}>
            <span>
              Showing: <b>{describeRange(loadedRange)}</b>
            </span>
            {dataAsOf && <span>Leads as of {this.formatTime(dataAsOf)}</span>}
          </div>
        )}
        {warnings && warnings.length > 0 && (
          <div style={{ ...barStyle, ...warningStyle }}>
            <span>Some data may be incomplete: {warnings.join(" · ")}</span>
            <button style={buttonStyle} onClick={onRetry}>Retry</button>
          </div>
        )}
      </div>
    );
  }
}

const barStyle = {
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  padding: "8px 16px",
  marginTop: "12px",
  borderRadius: "10px",
  fontSize: "14px",
};
const infoStyle = { backgroundColor: "#e6f0fb", color: "#1d4f8c" };
const warningStyle = { backgroundColor: "#fff4d6", color: "#7a5300" };
const errorStyle = { backgroundColor: "#fde4e4", color: "#9b1c1c", fontWeight: 600 };
const buttonStyle = { fontSize: "12px", padding: "4px 12px", cursor: "pointer" };
