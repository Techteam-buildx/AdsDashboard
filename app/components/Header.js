class Header extends React.Component {
  static contextType = PageContext;

  constructor(props) {
    super(props);
    this.requestCounter = 0;
    this.abortController = null;
    this.lastRequest = null;
    this.state = {
      page: "comparison",
      graphData: null,
      graph: emptyGraph(),
      widgets: emptyWidgets(),
      graphInterval: "daily",
      startDate: null,
      endDate: null,
      mStartDate: null,
      mEndDate: null,
      loading: true,
      error: null,
      warnings: [],
      loadedRange: null,
      dataAsOf: null,
      city: "",
      cities: DEFAULT_CITIES,
      ...emptyLeads(),
    };
  }

  changeGraphInterval = (type) => {
    this.setState((prevState) => {
      if (!prevState.graphData) return { graphInterval: type };
      const updatedGraph = this.computeGraph(
        prevState.graphData,
        prevState.page,
        type
      );
      return {
        ...prevState,
        graphInterval: type,
        graph: updatedGraph,
      };
    });
  };

  changePage = (newPage) => {
    this.setState((prevState) => {
      if (!prevState.graphData) return { page: newPage, graphInterval: "daily" };
      const updatedWidgets = this.computeWidgets(prevState.graphData, newPage);
      const updatedGraph = this.computeGraph(
        prevState.graphData,
        newPage,
        "daily"
      );
      return {
        ...prevState,
        graphInterval:"daily",
        page: newPage,
        widgets: updatedWidgets,
        graph: updatedGraph,
      };
    });
  };

  componentDidMount() {
    const formattedDate = formatLocalDate(new Date());
    this.handleDateChange(formattedDate, formattedDate);
    fetchCities().then((cities) => {
      if (cities) this.setState({ cities });
    });
  }

  componentWillUnmount() {
    if (this.abortController) this.abortController.abort();
  }

  handleMeetingDateChange = (startDate, endDate) => {
    console.log("Meeting Dates changed:", startDate, endDate);
    this.setState({ mStartDate: startDate, mEndDate: endDate });
    this.loadData({
      startDate: this.state.startDate,
      endDate: this.state.endDate,
      mStartDate: startDate,
      mEndDate: endDate,
      city: this.state.city,
    });
  };

  handleDateChange = (startDate, endDate) => {
    console.log("Main Dates changed:", startDate, endDate);
    this.setState({
      startDate,
      endDate,
      mStartDate: startDate,
      mEndDate: endDate,
    });
    if (startDate && endDate) {
      this.loadData({ startDate, endDate, city: this.state.city });
    }
  };

  handleCityChange = (city) => {
    this.setState({ city });
    if (this.lastRequest) this.loadData({ ...this.lastRequest, city });
  };

  retry = () => {
    if (this.lastRequest) this.loadData(this.lastRequest);
  };

  // Fetches dashboard data for a selection. Only the most recent selection may update
  // the screen: older in-flight requests are aborted and their results ignored, and a
  // failed request clears the numbers instead of leaving the previous range's data visible.
  loadData = async (request) => {
    const requestId = ++this.requestCounter;
    this.lastRequest = request;
    if (this.abortController) this.abortController.abort();
    const controller = new AbortController();
    this.abortController = controller;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    this.setState({ loading: true, error: null, warnings: [] });

    try {
      const data = await fetchDashboard(request, controller.signal);
      if (requestId !== this.requestCounter) return;

      const widgets = this.computeWidgets(data, this.state.page);
      const graph = this.computeGraph(data, this.state.page, this.state.graphInterval);
      const leads = this.getLeads(data);
      const errors = (data.meta && data.meta.errors) || {};

      this.setState({
        graphData: data,
        widgets,
        graph,
        loading: false,
        loadedRange: request,
        dataAsOf: data.meta ? data.meta.leadsAsOf : null,
        warnings: Object.values(errors),
        ...leads,
      });
    } catch (e) {
      if (requestId !== this.requestCounter) return;
      const message =
        e.name === "AbortError"
          ? "The server took too long to respond."
          : e.message || "Request failed.";
      console.error("Error fetching dashboard data: ", message);
      this.setState({
        graphData: null,
        widgets: emptyWidgets(),
        graph: emptyGraph(),
        loading: false,
        loadedRange: null,
        dataAsOf: null,
        error: `Couldn't load data for ${describeRange(request)}. ${message}`,
        ...emptyLeads(),
      });
    } finally {
      clearTimeout(timer);
    }
  };

  computeWidgets = (data, page) => {
    let budget,
      leads,
      cpl,
      meetings_done,
      cpm,
      qualified,
      future_qualified,
      cpq,
      converted,
      lpc,
      cqf,
      range_meeting;

    if (page === "comparison") {
      budget =
        data.google_budget +
        data.facebook_budget +
        data.referral_budget +
        data.cplead_budget;
      leads =
        data.google_leads +
        data.facebook_leads +
        data.referral_leads +
        data.cplead_leads;
      cpl = budget / (leads || 1);
      meetings_done =
        data.google_meetings_done +
        data.facebook_meetings_done +
        data.referral_meetings_done +
        data.cplead_meetings_done;
      cpm = budget / (meetings_done || 1);
      qualified =
        data.google_qualified +
        data.facebook_qualified +
        data.referral_qualified +
        data.cplead_qualified;
      future_qualified =
        data.google_future_qualified +
        data.facebook_future_qualified +
        data.referral_future_qualified +
        data.cplead_future_qualified;
      cpq = budget / (qualified || 1);
      converted =
        data.google_converted +
        data.facebook_converted +
        data.referral_converted +
        data.cplead_converted;
      lpc = converted > 0 ? budget / converted : 0;
      cqf =
        future_qualified + qualified > 0
          ? budget / (future_qualified + qualified)
          : 0;
      range_meeting = data.google_meeting + data.facebook_meeting;
    } else if (page === "referral") {
      budget = data.referral_budget;
      leads = data.referral_leads;
      cpl = data.cpl_referral;
      meetings_done = data.referral_meetings_done;
      cpm = data.cpm_referral;
      qualified = data.referral_qualified;
      future_qualified = data.referral_future_qualified;
      cpq = qualified ? budget / qualified : 0;
      converted = data.referral_converted;
      lpc = data.lpc_referral;
      cqf =
        data.referral_future_qualified + data.referral_qualified > 0
          ? budget / (data.referral_future_qualified + data.referral_qualified)
          : 0;
      // range_meeting
    } else if (page === "cplead") {
      budget = data.cplead_budget;
      leads = data.cplead_leads;
      cpl = data.cpl_cplead;
      meetings_done = data.cplead_meetings_done;
      cpm = data.cpm_cplead;
      qualified = data.cplead_qualified;
      future_qualified = data.cplead_future_qualified;
      cpq = qualified ? budget / qualified : 0;
      converted = data.cplead_converted;
      lpc = data.lpc_cplead;
      cqf =
        data.cplead_future_qualified + data.cplead_qualified > 0
          ? budget / (data.cplead_future_qualified + data.cplead_qualified)
          : 0;
    } else if (page == "socials") {
      budget = data.socials_budget;
      leads = data.socials_leads;
      cpl = data.cpl_socials;
      meetings_done = data.socials_meetings_done;
      cpm = data.cpm_socials;
      qualified = data.socials_qualified;
      future_qualified = data.socials_future_qualified;
      cpq = qualified ? budget / qualified : 0;
      converted = data.socials_converted;
      lpc = data.lpc_socials;
      cqf =
        future_qualified + qualified > 0
          ? budget / (future_qualified + qualified)
          : 0;
    } else {
      const isFacebook = page === "facebook";
      budget = isFacebook ? data.facebook_budget : data.google_budget;
      leads = isFacebook ? data.facebook_leads : data.google_leads;
      cpl = isFacebook ? data.cpl_facebook : data.cpl_google;
      meetings_done = isFacebook
        ? data.facebook_meetings_done
        : data.google_meetings_done;
      cpm = isFacebook ? data.cpm_facebook : data.cpm_google;
      qualified = isFacebook ? data.facebook_qualified : data.google_qualified;
      future_qualified = isFacebook
        ? data.facebook_future_qualified
        : data.google_future_qualified;
      cpq = qualified ? budget / qualified : 0;
      converted = isFacebook ? data.facebook_converted : data.google_converted;
      lpc = isFacebook ? data.lpc_facebook : data.lpc_google;
      cqf = isFacebook
        ? data.facebook_future_qualified + data.facebook_qualified > 0
          ? budget / (data.facebook_future_qualified + data.facebook_qualified)
          : 0
        : data.google_future_qualified + data.google_qualified > 0
        ? budget / (data.google_future_qualified + data.google_qualified)
        : 0;
      range_meeting = isFacebook ? data.facebook_meeting : data.google_meeting;
    }

    return [
      { id: 1, title: "Budget", value: Math.floor(budget) },
      { id: 2, title: "Leads", value: Math.floor(leads) },
      { id: 3, title: "Cost/Lead", value: Math.floor(cpl) },
      { id: 4, title: "Meetings Done", value: Math.floor(meetings_done) },
      // { id: 5, title: `Meetings b/w above dates`, value: Math.floor(range_meeting) },
      { id: 5, title: "Cost/Meeting", value: Math.floor(cpm) },
      { id: 6, title: "Qualified", value: Math.floor(qualified) },
      { id: 7, title: "Future Qualified", value: Math.floor(future_qualified) },
      { id: 8, title: "Cost/Qualified", value: Math.floor(cpq) },
      { id: 9, title: "Cost/(FQ + QF)", value: Math.floor(cqf) },
      { id: 10, title: "Conversions", value: Math.floor(converted) },
      { id: 11, title: "Cost/Conversion", value: Math.floor(lpc) || 0 },
    ];
  };

  getLeads = (data) => {
    const google = this.computeWidgets(data, "google");
    const fb = this.computeWidgets(data, "facebook");
    const referral = this.computeWidgets(data, "referral");
    const cplead = this.computeWidgets(data, "cplead");
    const socials = this.computeWidgets(data, "socials");

    const google_leads = google.find((w) => w.title === "Leads")?.value || 0;
    const fb_leads = fb.find((w) => w.title === "Leads")?.value || 0;
    const referral_leads =
      referral.find((w) => w.title === "Leads")?.value || 0;
    const cplead_leads = cplead.find((w) => w.title === "Leads")?.value || 0;
    const socials_leads = socials.find((w) => w.title === "Leads")?.value || 0;
    const q_google = google.find((w) => w.title === "Qualified")?.value || 0;
    const q_fb = fb.find((w) => w.title === "Qualified")?.value || 0;
    const q_referral =
      referral.find((w) => w.title === "Qualified")?.value || 0;
    const q_cplead = cplead.find((w) => w.title === "Qualified")?.value || 0;
    const q_socials = socials.find((w) => w.title === "Qualified")?.value || 0;
    const m_google =
      google.find((w) => w.title === "Meetings Done")?.value || 0;
    const m_fb = fb.find((w) => w.title === "Meetings Done")?.value || 0;
    const m_socials =
      socials.find((w) => w.title === "Meetings Done")?.value || 0;
    const m_referral =
      referral.find((w) => w.title === "Meetings Done")?.value || 0;
    const m_cplead =
      cplead.find((w) => w.title === "Meetings Done")?.value || 0;

    return {
      fb: fb_leads,
      google: google_leads,
      socials: socials_leads,
      referral: referral_leads,
      cplead: cplead_leads,
      q_google,
      q_fb,
      q_socials,
      q_referral,
      q_cplead,
      m_google,
      m_fb,
      m_socials,
      m_referral,
      m_cplead,
    };
  };

  // Sums daily values into calendar weeks (Mon–Sun) or calendar months.
  consolidateData(dates, values, interval = "weekly") {
    const labels = [];
    const resultValues = [];
    let currentKey = null;

    dates.forEach((date, i) => {
      const key = bucketLabel(date, interval);
      if (key !== currentKey) {
        currentKey = key;
        labels.push(key);
        resultValues.push(0);
      }
      resultValues[resultValues.length - 1] += values[i] || 0;
    });

    return { labels, values: resultValues };
  }


  computeGraph = (data, page, graphType) => {
    let labels = data.labels || [];
    const safeArray = (arr) =>
      Array.isArray(arr) ? arr : Array(labels.length).fill(0);
    const addArrays = (arr1, arr2) => {
      const a = safeArray(arr1);
      const b = safeArray(arr2);
      return a.map((val, i) => val + b[i]);
    };

    let f, s, m, q, c;

    if (page === "comparison") {
      f = addArrays(
        addArrays(data.google_budgetData, data.facebook_budgetData),
        addArrays(data.referral_budgetData, data.cplead_budgetData)
      );
      s = addArrays(
        addArrays(data.google_leadsData, data.facebook_leadsData),
        addArrays(data.referral_leadsData, data.cplead_leadsData)
      );
      m = addArrays(
        addArrays(data.google_meetingsData, data.facebook_meetingsData),
        addArrays(data.referral_meetingsData, data.cplead_meetingsData)
      );
      q = addArrays(
        addArrays(data.google_qualifiedData, data.facebook_qualifiedData),
        addArrays(data.referral_qualifiedData, data.cplead_qualifiedData)
      );
      c = addArrays(
        addArrays(data.google_convertedData, data.facebook_convertedData),
        addArrays(data.referral_convertedData, data.cplead_convertedData)
      );
    } else if (page === "referral") {
      f = safeArray(data.referral_budgetData);
      s = safeArray(data.referral_leadsData);
      m = safeArray(data.referral_meetingsData);
      q = safeArray(data.referral_qualifiedData);
      c = safeArray(data.referral_convertedData);
    } else if (page === "cplead") {
      f = safeArray(data.cplead_budgetData);
      s = safeArray(data.cplead_leadsData);
      m = safeArray(data.cplead_meetingsData);
      q = safeArray(data.cplead_qualifiedData);
      c = safeArray(data.cplead_convertedData);
    } else if (page === "socials") {
      f = safeArray(data.socials_budgetData);
      s = safeArray(data.socials_leadsData);
      m = safeArray(data.socials_meetingsData);
      q = safeArray(data.socials_qualifiedData);
      c = safeArray(data.socials_convertedData);
    } else {
      const isFacebook = page === "facebook";
      f = safeArray(
        isFacebook ? data.facebook_budgetData : data.google_budgetData
      );
      s = safeArray(
        isFacebook ? data.facebook_leadsData : data.google_leadsData
      );
      m = safeArray(
        isFacebook ? data.facebook_meetingsData : data.google_meetingsData
      );
      q = safeArray(
        isFacebook ? data.facebook_qualifiedData : data.google_qualifiedData
      );
      c = safeArray(
        isFacebook ? data.facebook_convertedData : data.google_convertedData
      );
    }


    if (graphType === "monthly" || graphType === "weekly") {
      const dates = labels;
      labels = this.consolidateData(dates, f, graphType).labels;
      [f, m, c, q, s] = [f, m, c, q, s].map(
        (series) => this.consolidateData(dates, series, graphType).values
      );
    }


    return {
      leads: { labels, firstY: f, secondY: s },
      meetings: { labels, firstY: f, secondY: m },
      converted: { labels, firstY: f, secondY: c },
      qualified: { labels, firstY: f, secondY: q },
    };
  };

  render() {
    const { page, widgets, graph, loading } = this.state;

    // if (loading) {
    //     return <Reloading />;
    // }
    return (
      <PageContext.Provider
        value={{
          page: page,
          changePage: this.changePage,
          graphInterval: this.state.graphInterval,
          changeGraphInterval: this.changeGraphInterval,
          loading: loading,
        }}
      >
        <div
          style={{
            alignItems: "center",
            width: "100%",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.75)",
            backgroundColor: "#f0ecec",
            maxHeight: 80,
            minHeight: 80,
            position: "sticky",
            zIndex:8,
            top: 0,
            display: "flex",
            justifyContent: "flex-start",
            gap: "40px",
          }}
        >
          <TimeOptions onDateChange={this.handleDateChange} />
          <MeetingOptions
            onDateChange={this.handleMeetingDateChange}
            startDate={this.state.startDate}
            endDate={this.state.endDate}
          />
          <CityOptions
            city={this.state.city}
            cities={this.state.cities}
            onCityChange={this.handleCityChange}
          />
          <PageOptions />
          <GraphIntervalOptions />
        </div>
        <div className="content-div">
          <StatusBar
            loading={loading}
            error={this.state.error}
            warnings={this.state.warnings}
            loadedRange={this.state.loadedRange}
            dataAsOf={this.state.dataAsOf}
            onRetry={this.retry}
          />
          <div
            className={
              page === "google" ? "nav-container" : "nav-container facebook"
            }
          >
            {page === "google" ? (
              <div style={{ fontSize: "40px", fontWeight: 600 }}>
                <span style={{ color: "#307cd4" }}>G</span>
                <span style={{ color: "#cc1919" }}>o</span>
                <span style={{ color: "#ecb418" }}>o</span>
                <span style={{ color: "#307cd4" }}>g</span>
                <span style={{ color: "#5cc45c" }}>l</span>
                <span style={{ color: "#cc1919" }}>e</span>
              </div>
            ) : page === "facebook" ? (
              <div style={{ fontSize: "40px", fontWeight: 600 }}>
                <span
                  style={{
                    backgroundColor: "#408cf4",
                    color: "white",
                    padding: "5px 10px",
                    borderRadius: "10px",
                  }}
                >
                  F
                </span>
                acebook
              </div>
            ) : page === "referral" ? (
              <h1>Referral</h1>
            ) : page === "cplead" ? (
              <h1>CP Leads</h1>
            ) : page === "socials" ? (
              <h1>Socials</h1>
            ) : (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <div style={{ fontSize: "40px", fontWeight: 600 }}>
                  <span style={{ color: "#307cd4" }}>C</span>
                  <span style={{ color: "#cc1919" }}>o</span>
                  <span style={{ color: "#ecb418" }}>m</span>
                  <span style={{ color: "#307cd4" }}>b</span>
                  <span style={{ color: "#5cc45c" }}>i</span>
                  <span style={{ color: "#86ccea" }}>n</span>
                  <span style={{ color: "#e08048" }}>e</span>
                  <span style={{ color: "#408cf4" }}>d</span>
                </div>
                <div style={{ fontSize: "40px", fontWeight: 600 }}>
                  <span
                    style={{
                      backgroundColor: "#408cf4",
                      color: "white",
                      padding: "5px 10px",
                      borderRadius: "10px",
                    }}
                  >
                    D
                  </span>
                  ata
                </div>
              </div>
            )}

            {page !== "comparison" && (
              <div
                style={{ padding: "5px", fontSize: "30px", fontWeight: 600 }}
              >
                Ads Performance
              </div>
            )}
          </div>

          <div className="widget-container">
            {widgets.map((widget, index) => (
              <div
                key={widget.id || index}
                className={page === "google" ? "widget" : "widget facebook"}
              >
                {loading ? (
                  <Reloading />
                ) : (
                  <>
                    <p
                      className={
                        page === "google"
                          ? "widget-heading"
                          : "widget-heading facebook"
                      }
                    >
                      {widget.title}
                    </p>
                    <p
                      className={
                        page === "google"
                          ? "widget-content"
                          : "widget-content facebook"
                      }
                    >
                      {widget.value}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "20px" }}>
        <DynamicTable propObj={graph} page={this.state.page} load={this.state.loading}/>
      </div>
          <GraphSection
            data={graph}
            google={this.state.google}
            fb={this.state.fb}
            referral={this.state.referral}
            socials={this.state.socials}
            cplead={this.state.cplead}
            q_google={this.state.q_google}
            q_fb={this.state.q_fb}
            q_referral={this.state.q_referral}
            q_socials={this.state.q_socials}
            q_cplead={this.state.q_cplead}
            m_google={this.state.m_google}
            m_fb={this.state.m_fb}
            m_referral={this.state.m_referral}
            m_socials={this.state.m_socials}
            m_cplead={this.state.m_cplead}
          />
        </div>
      </PageContext.Provider>
    );
  }
}
// ---------- data loading helpers ----------

const API_BASE =
  window.ADS_API_BASE != null
    ? window.ADS_API_BASE
    : "https://2onghku7vk.execute-api.ap-south-1.amazonaws.com/dev";
// API Gateway gives up at 29s; stop waiting just before that.
const REQUEST_TIMEOUT_MS = 28000;

const DEFAULT_CITIES = ["Bangalore", "Hyderabad", "Hossur"];

const WIDGET_TITLES = [
  "Budget", "Leads", "Cost/Lead", "Meetings Done", "Cost/Meeting", "Qualified",
  "Future Qualified", "Cost/Qualified", "Cost/(FQ + QF)", "Conversions", "Cost/Conversion",
];

function emptyWidgets() {
  return WIDGET_TITLES.map((title, i) => ({ id: i + 1, title, value: "–" }));
}

function emptyGraph() {
  const empty = () => ({ labels: [], firstY: [], secondY: [] });
  return { leads: empty(), meetings: empty(), qualified: empty(), converted: empty() };
}

function emptyLeads() {
  const out = {};
  ["google", "fb", "socials", "referral", "cplead"].forEach((k) => {
    out[k] = 0;
    out[`q_${k}`] = 0;
    out[`m_${k}`] = 0;
  });
  return out;
}

// YYYY-MM-DD in the viewer's local time zone (toISOString() would give the UTC date).
function formatLocalDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function prettyDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function describeRange(r) {
  if (!r) return "";
  const range = r.startDate === r.endDate
    ? prettyDate(r.startDate)
    : `${prettyDate(r.startDate)} – ${prettyDate(r.endDate)}`;
  const parts = [range];
  if (r.mStartDate && r.mEndDate) {
    parts.push(`meetings ${prettyDate(r.mStartDate)} – ${prettyDate(r.mEndDate)}`);
  }
  parts.push(r.city || "All Cities");
  return parts.join(" · ");
}

// Calendar bucket for a YYYY-MM-DD label: "Oct 2026" or "Wk of 6 Oct" (weeks start Monday).
function bucketLabel(ymd, interval) {
  const [y, m, d] = ymd.split("-").map(Number);
  if (interval === "monthly") return `${MONTHS[m - 1]} ${y}`;
  const date = new Date(Date.UTC(y, m - 1, d));
  const offset = (date.getUTCDay() + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - offset);
  return `Wk of ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

async function readJson(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (e) {
    // non-JSON body (e.g. old backend's "err: ..." text)
  }
  if (!response.ok) {
    const detail = (body && (body.error || body.message)) || `HTTP ${response.status}`;
    throw new Error(response.status === 504 ? "The server timed out." : detail);
  }
  if (!body || typeof body !== "object") throw new Error("Unexpected response from server.");
  return body;
}

// Uses the combined /app/dashboard endpoint; falls back to the two legacy
// endpoints (fetched in parallel) if the backend hasn't been updated yet.
async function fetchDashboard({ startDate, endDate, mStartDate, mEndDate, city }, signal) {
  const meetingFilter = Boolean(mStartDate && mEndDate);
  const params = [];
  if (meetingFilter) params.push(`mstart=${mStartDate}`, `mend=${mEndDate}`);
  if (city) params.push(`city=${encodeURIComponent(city)}`);
  const query = params.length ? `?${params.join("&")}` : "";
  const response = await fetch(`${API_BASE}/app/dashboard/${startDate}/${endDate}${query}`, { signal });
  if (response.status !== 404 && response.status !== 403) {
    return readJson(response);
  }
  if (city) throw new Error("The City filter needs the updated backend.");

  const leadsUrl = meetingFilter
    ? `${API_BASE}/app/leads/meetingfilter/${startDate}/${endDate}/${mStartDate}/${mEndDate}`
    : `${API_BASE}/app/leads/${startDate}/${endDate}`;
  const meetingsUrl = meetingFilter
    ? `${API_BASE}/app/leads/meetings/${mStartDate}/${mEndDate}`
    : `${API_BASE}/app/leads/meetings/${startDate}/${endDate}`;
  const [data, meetingData] = await Promise.all([
    fetch(leadsUrl, { signal }).then(readJson),
    fetch(meetingsUrl, { signal }).then(readJson),
  ]);
  if (typeof data.google_budget !== "number") throw new Error("Unexpected response from server.");
  ["google_meeting", "facebook_meeting", "socials_meeting", "referral_meeting", "cplead_meeting"].forEach(
    (k) => { data[k] = meetingData[k] || 0; }
  );
  return data;
}

// City list from the backend; null if unavailable (older backend), keeping the defaults.
async function fetchCities() {
  try {
    const response = await fetch(`${API_BASE}/app/config`);
    if (!response.ok) return null;
    const body = await response.json();
    return Array.isArray(body.cities) && body.cities.length ? body.cities : null;
  } catch (e) {
    return null;
  }
}
