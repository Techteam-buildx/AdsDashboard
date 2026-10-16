// Source tabs (Combined, Google Ads, Meta Ads, ...).
class SourceTabs extends React.Component {
  render() {
    const { value, onChange } = this.props;
    return (
      <nav className="tabs" role="tablist" aria-label="Lead source">
        {SOURCES.map((s) => (
          <button
            key={s.key}
            role="tab"
            aria-selected={value === s.key}
            className={value === s.key ? "tab is-active" : "tab"}
            onClick={() => onChange(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>
    );
  }
}

class KpiTile extends React.Component {
  render() {
    const { label, value, title, hint, primary } = this.props;
    return (
      <div className={primary ? "kpi kpi-primary" : "kpi"}>
        <div className="kpi-label">{label}</div>
        <div className="kpi-value" title={title}>{value}</div>
        {hint && <div className="kpi-hint">{hint}</div>}
      </div>
    );
  }
}

// Headline KPIs (spend → leads → meetings) and the lead-quality row below them.
class KpiTiles extends React.Component {
  render() {
    const m = this.props.metrics;
    const v = (x, fmt) => (m ? fmt(x) : "–");
    const money = (x) => v(x, formatRupeesCompact);
    const full = (x) => (m && x != null ? formatRupees(x) : undefined);
    return (
      <section className="kpis" aria-label="Key metrics">
        <div className="kpi-row kpi-row-primary">
          <KpiTile primary label="Spend" value={money(m && m.spend)} title={full(m && m.spend)} hint="incl. GST" />
          <KpiTile primary label="Leads" value={v(m && m.leads, formatCount)} />
          <KpiTile primary label="Cost per lead" value={money(m && m.cpl)} title={full(m && m.cpl)} />
          <KpiTile primary label="Meetings done" value={v(m && m.meetings, formatCount)} />
          <KpiTile primary label="Cost per meeting" value={money(m && m.cpm)} title={full(m && m.cpm)} />
        </div>
        <div className="kpi-row">
          <KpiTile label="Qualified" value={v(m && m.qualified, formatCount)} />
          <KpiTile label="Future qualified" value={v(m && m.futureQualified, formatCount)} />
          <KpiTile label="Cost per qualified" value={money(m && m.cpq)} title={full(m && m.cpq)} />
          <KpiTile label="Cost per (Q + FQ)" value={money(m && m.cqf)} title={full(m && m.cqf)} />
          <KpiTile label="Conversions" value={v(m && m.conversions, formatCount)} />
          <KpiTile label="Cost per conversion" value={money(m && m.cpc)} title={full(m && m.cpc)} />
        </div>
      </section>
    );
  }
}
