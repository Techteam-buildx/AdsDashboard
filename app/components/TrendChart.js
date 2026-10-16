// A line needs at least two points; a single day (e.g. Today) is drawn as bars instead.
function chartKind(kind, labels) {
  return kind === "line" && labels.length < 2 ? "bar" : kind;
}

// Vertical hairline that follows the hovered date.
const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const active = chart.tooltip && chart.tooltip.getActiveElements();
    if (!active || !active.length) return;
    const x = active[0].element.x;
    const { top, bottom } = chart.chartArea;
    const ctx = chart.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1;
    ctx.strokeStyle = themeColor("--axis");
    ctx.stroke();
    ctx.restore();
  },
};

// One chart, one y-axis. `series`: [{ label, data, colorVar }]; `kind`: "bar" | "line".
// `format` formats values for the axis/tooltip ("money" or "count").
class TrendChart extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.chart = null;
  }

  componentDidMount() {
    this.build();
  }

  componentDidUpdate(prev) {
    if (prev.labels !== this.props.labels || prev.series !== this.props.series || prev.kind !== this.props.kind) {
      this.build();
    }
  }

  componentWillUnmount() {
    if (this.chart) this.chart.destroy();
  }

  build() {
    if (this.chart) this.chart.destroy();
    const { labels, series, format } = this.props;
    const kind = chartKind(this.props.kind, labels);
    const fmtTick = format === "money" ? formatRupeesAxis : (v) => formatCount(v);
    const fmtValue = format === "money" ? formatRupees : formatCount;
    const grid = themeColor("--grid");
    const muted = themeColor("--text-muted");

    this.chart = new Chart(this.canvasRef.current.getContext("2d"), {
      type: kind,
      data: {
        labels,
        datasets: series.map((s) => {
          const color = themeColor(s.colorVar);
          return kind === "bar"
            ? { label: s.label, data: s.data, backgroundColor: color, hoverBackgroundColor: color,
                borderRadius: { topLeft: 4, topRight: 4 }, borderSkipped: "start", maxBarThickness: 28,
                categoryPercentage: 0.8, barPercentage: 0.9 }
            : { label: s.label, data: s.data, borderColor: color, backgroundColor: color, borderWidth: 2,
                pointRadius: labels.length > 31 ? 0 : 3, pointHoverRadius: 5, pointBorderWidth: 2,
                pointBorderColor: themeColor("--surface"), tension: 0, spanGaps: true };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 250 },
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false }, // HTML legend below the title
          tooltip: {
            backgroundColor: themeColor("--surface"),
            titleColor: themeColor("--text-secondary"),
            bodyColor: themeColor("--text-primary"),
            borderColor: themeColor("--border"),
            borderWidth: 1,
            padding: 10,
            boxWidth: 12,
            boxHeight: 2,
            usePointStyle: false,
            callbacks: {
              label: (ctx) => ` ${ctx.raw == null ? "–" : fmtValue(ctx.raw)}  ${ctx.dataset.label}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: themeColor("--axis") },
            ticks: { color: muted, maxRotation: 0, autoSkip: true, maxTicksLimit: 10, font: { size: 11 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: grid },
            border: { display: false },
            ticks: { color: muted, font: { size: 11 }, maxTicksLimit: 6, callback: fmtTick, precision: 0 },
          },
        },
      },
      plugins: [crosshairPlugin],
    });
  }

  render() {
    const { title, subtitle, series, labels } = this.props;
    const kind = chartKind(this.props.kind, labels);
    return (
      <div className="card chart-card">
        <div className="card-head">
          <div>
            <h3 className="card-title">{title}</h3>
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {series.length > 1 && (
            <ul className="legend">
              {series.map((s) => (
                <li key={s.label}>
                  <span className={kind === "bar" ? "legend-key legend-rect" : "legend-key legend-line"}
                        style={{ background: `var(${s.colorVar})` }} />
                  {s.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="chart-box">
          <canvas ref={this.canvasRef} role="img" aria-label={title} />
        </div>
      </div>
    );
  }
}
