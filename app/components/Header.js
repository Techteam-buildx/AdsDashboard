class Header extends React.Component {
    static contextType = PageContext;

    constructor(props) {
        super(props);
        this.state = {
            page: "comparison",
            graphData: null,
            graph: {
                leads: { labels: [], firstY: [], secondY: [] },
                meetings: { labels: [], firstY: [], secondY: [] },
                qualified: { labels: [], firstY: [], secondY: [] },
                converted: { labels: [], firstY: [], secondY: [] },
            },
            widgets: Array.from({ length: 8 }, (_, i) => ({ id: i + 1 })),
            startDate: null,
            endDate: null,
            mStartDate: null,
            mEndDate: null,
            loading: true,
            google: 0,
            fb: 0,
            referral: 0,
            cplead: 0,
            q_google: 0,
            q_fb: 0,
            q_referral: 0,
            q_cplead: 0,
            m_google: 0,
            m_fb: 0,
            m_referral: 0,
            m_cplead: 0
        };
    }

    changePage = (newPage) => {
        this.setState((prevState) => {
            const updatedWidgets = this.computeWidgets(prevState.graphData, newPage);
            const updatedGraph = this.computeGraph(prevState.graphData, newPage);
            return {
                ...prevState,
                page: newPage,
                widgets: updatedWidgets,
                graph: updatedGraph
            };
        });
    }

    componentDidMount() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;

        this.handleDateChange(formattedDate, formattedDate);
    }

    handleMeetingDateChange = async (startDate, endDate) => {
        console.log("Meeting Dates changed:", startDate, endDate);
        this.setState({ mStartDate: startDate, mEndDate: endDate, loading: true });

        try {
            const response = await fetch(`https://adsdashboardbackend.onrender.com/app/leads/meetingfilter/${this.state.startDate}/${this.state.endDate}/${startDate}/${endDate}`);
            const data = await response.json();

            const meetingResponse = await fetch(`https://adsdashboardbackend.onrender.com/app/leads/meetings/${startDate}/${endDate}`);
            const meetingData = await meetingResponse.json();

            data.google_meeting = meetingData.google_meeting || 0;
            data.facebook_meeting = meetingData.facebook_meeting || 0;
            data.referral_meeting = meetingData.referral_meeting || 0;
            data.cplead_meeting = meetingData.cplead_meeting || 0;

            const widgets = this.computeWidgets(data, this.state.page);
            const graph = this.computeGraph(data, this.state.page);
            const leads = this.getLeads(data);

            this.setState({
                graphData: data,
                widgets,
                graph,
                loading: false,
                google: leads.google,
                fb: leads.fb,
                referral: leads.referral,
                cplead: leads.cplead,
                q_google: leads.q_google,
                q_fb: leads.q_fb,
                q_referral: leads.q_referral,
                q_cplead: leads.q_cplead,
                m_google: leads.m_google,
                m_fb: leads.m_fb,
                m_referral: leads.m_referral,
                m_cplead: leads.m_cplead
            });


        } catch (e) {
            console.error("Error fetching main data: ", e.message);
            this.setState({ loading: false });
        }


        // if (startDate && endDate) {
        //     try {
        //         const response = await fetch(`https://adsdashboardbackend.onrender.com/app/leads/meetings/${startDate}/${endDate}`);
        //         const data = await response.json();

        //         const page = this.state.page;
        //         let value;
        //         //API2 LEFT
        //         if (page === "comparison") {
        //             value = data.google_meeting + data.facebook_meeting;
        //         } else if (page === "facebook") {
        //             value = data.facebook_meeting;
        //         } else {
        //             value = data.google_meeting;
        //         }


        //         this.setState(prevState => ({
        //             widgets: prevState.widgets.map(widget =>
        //                 widget.id === 5 ? { ...widget, value } : widget
        //             ),
        //             loading: false
        //         }));
        //     } catch (e) {
        //         console.error("Error fetching meeting data: ", e.message);
        //         this.setState({ loading: false });
        //     }
        // }
    };



    handleDateChange = async (startDate, endDate) => {
        console.log("Main Dates changed:", startDate, endDate);
        this.setState({ startDate, endDate, mStartDate: startDate, mEndDate: endDate, loading: true });

        if (startDate && endDate) {
            try {
                const response = await fetch(`https://adsdashboardbackend.onrender.com/app/leads/${startDate}/${endDate}`);
                const data = await response.json();

                const meetingResponse = await fetch(`https://adsdashboardbackend.onrender.com/app/leads/meetings/${startDate}/${endDate}`);
                const meetingData = await meetingResponse.json();

                data.google_meeting = meetingData.google_meeting || 0;
                data.facebook_meeting = meetingData.facebook_meeting || 0;
                data.referral_meeting = meetingData.referral_meeting || 0;
                data.cplead_meeting = meetingData.cplead_meeting || 0;

                const widgets = this.computeWidgets(data, this.state.page);
                const graph = this.computeGraph(data, this.state.page);
                const leads = this.getLeads(data);

                this.setState({
                    graphData: data,
                    widgets,
                    graph,
                    loading: false,
                    google: leads.google,
                    fb: leads.fb,
                    referral: leads.referral,
                    cplead: leads.cplead,
                    q_google: leads.q_google,
                    q_fb: leads.q_fb,
                    q_referral: leads.q_referral,
                    q_cplead: leads.q_cplead,
                    m_google: leads.m_google,
                    m_fb: leads.m_fb,
                    m_referral: leads.m_referral,
                    m_cplead: leads.m_cplead
                });


            } catch (e) {
                console.error("Error fetching main data: ", e.message);
                this.setState({ loading: false });
            }
        }
    };




    computeWidgets = (data, page) => {
        let budget, leads, cpl, meetings_done, cpm, qualified, future_qualified, cpq, converted, lpc, cqf, range_meeting;

        if (page === "comparison") {
            budget = data.google_budget + data.facebook_budget + data.referral_budget + data.cplead_budget;
            leads = data.google_leads + data.facebook_leads + data.referral_leads + data.cplead_leads;
            cpl = (budget) / (leads || 1);
            meetings_done = data.google_meetings_done + data.facebook_meetings_done + data.referral_meetings_done + data.cplead_meetings_done;
            cpm = (budget) / (meetings_done || 1);
            qualified = data.google_qualified + data.facebook_qualified + data.referral_qualified + data.cplead_qualified;
            future_qualified = data.google_future_qualified + data.facebook_future_qualified + data.referral_future_qualified + data.cplead_future_qualified;
            cpq = budget / (qualified || 1);
            converted = data.google_converted + data.facebook_converted + data.referral_converted + data.cplead_converted;
            lpc = converted > 0 ? budget / (converted) : 0;
            cqf = (future_qualified + qualified) > 0 ? (budget / (future_qualified + qualified)) : 0;
            range_meeting = data.google_meeting + data.facebook_meeting;
        }
        else if (page === "referral") {
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
            cqf = (data.referral_future_qualified + data.referral_qualified) > 0 ? (budget / (data.referral_future_qualified + data.referral_qualified)) : 0
            // range_meeting
        }
        else if (page === "cplead") {
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
            cqf = (data.cplead_future_qualified + data.cplead_qualified) > 0 ? (budget / (data.cplead_future_qualified + data.cplead_qualified)) : 0;
        }
        else {
            const isFacebook = page === "facebook";
            budget = isFacebook ? data.facebook_budget : data.google_budget;
            leads = isFacebook ? data.facebook_leads : data.google_leads;
            cpl = isFacebook ? data.cpl_facebook : data.cpl_google;
            meetings_done = isFacebook ? data.facebook_meetings_done : data.google_meetings_done;
            cpm = isFacebook ? data.cpm_facebook : data.cpm_google;
            qualified = isFacebook ? data.facebook_qualified : data.google_qualified;
            future_qualified = isFacebook ? data.facebook_future_qualified : data.google_future_qualified;
            cpq = qualified ? budget / qualified : 0;
            converted = isFacebook ? data.facebook_converted : data.google_converted;
            lpc = isFacebook ? data.lpc_facebook : data.lpc_google;
            cqf = isFacebook ? ((data.facebook_future_qualified + data.facebook_qualified) > 0 ? (budget / (data.facebook_future_qualified + data.facebook_qualified)) : 0) : ((data.google_future_qualified + data.google_qualified) > 0 ? (budget / (data.google_future_qualified + data.google_qualified)) : 0);
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
            { id: 11, title: "Cost/Conversion", value: Math.floor(lpc) || 0 }
        ];
    };

    getLeads = (data) => {
        const google = this.computeWidgets(data, "google");
        const fb = this.computeWidgets(data, "facebook");
        const referral = this.computeWidgets(data, "referral");
        const cplead = this.computeWidgets(data, "cplead");

        const google_leads = google.find(w => w.title === "Leads")?.value || 0;
        const fb_leads = fb.find(w => w.title === "Leads")?.value || 0;
        const referral_leads = referral.find(w => w.title === "Leads")?.value || 0;
        const cplead_leads = cplead.find(w => w.title === "Leads")?.value || 0;
        const q_google = google.find(w => w.title === "Qualified")?.value || 0;
        const q_fb = fb.find(w => w.title === "Qualified")?.value || 0;
        const q_referral = referral.find(w => w.title === "Qualified")?.value || 0;
        const q_cplead = cplead.find(w => w.title === "Qualified")?.value || 0;
        const m_google = google.find(w => w.title === "Meetings Done")?.value || 0;
        const m_fb = fb.find(w => w.title === "Meetings Done")?.value || 0;
        const m_referral = referral.find(w => w.title === "Meetings Done")?.value || 0;
        const m_cplead = cplead.find(w => w.title === "Meetings Done")?.value || 0;


        return { fb: fb_leads, google: google_leads, referral: referral_leads, cplead: cplead_leads, q_google, q_fb, q_referral, q_cplead, m_google, m_fb, m_referral, m_cplead };
    }



    computeGraph = (data, page) => {
        const labels = data.labels || [];

        const safeArray = (arr) => Array.isArray(arr) ? arr : Array(labels.length).fill(0);
        const addArrays = (arr1, arr2) => {
            const a = safeArray(arr1);
            const b = safeArray(arr2);
            return a.map((val, i) => val + b[i]);
        };

        let f, s, m, q, c;

        if (page === "comparison") {
            f = addArrays(addArrays(data.google_budgetData, data.facebook_budgetData), addArrays(data.referral_budgetData, data.cplead_budgetData));
            s = addArrays(addArrays(data.google_leadsData, data.facebook_leadsData), addArrays(data.referral_leadsData, data.cplead_leadsData));
            m = addArrays(addArrays(data.google_meetingsData, data.facebook_meetingsData), addArrays(data.referral_meetingsData, data.cplead_meetingsData));
            q = addArrays(addArrays(data.google_qualifiedData, data.facebook_qualifiedData), addArrays(data.referral_qualifiedData, data.cplead_qualifiedData));
            c = addArrays(addArrays(data.google_convertedData, data.facebook_convertedData), addArrays(data.referral_convertedData, data.cplead_convertedData));
        }
        else if (page === "referral") {
            f = safeArray(data.referral_budgetData);
            s = safeArray(data.referral_leadsData);
            m = safeArray(data.referral_meetingsData);
            q = safeArray(data.referral_qualifiedData);
            c = safeArray(data.referral_convertedData);
        }
        else if (page === "cplead") {
            f = safeArray(data.cplead_budgetData);
            s = safeArray(data.cplead_leadsData);
            m = safeArray(data.cplead_meetingsData);
            q = safeArray(data.cplead_qualifiedData);
            c = safeArray(data.cplead_convertedData);
        }
        else {
            const isFacebook = page === "facebook";
            f = safeArray(isFacebook ? data.facebook_budgetData : data.google_budgetData);
            s = safeArray(isFacebook ? data.facebook_leadsData : data.google_leadsData);
            m = safeArray(isFacebook ? data.facebook_meetingsData : data.google_meetingsData);
            q = safeArray(isFacebook ? data.facebook_qualifiedData : data.google_qualifiedData);
            c = safeArray(isFacebook ? data.facebook_convertedData : data.google_convertedData);
        }

        return {
            leads: { labels, firstY: f, secondY: s },
            meetings: { labels, firstY: f, secondY: m },
            converted: { labels, firstY: f, secondY: c },
            qualified: { labels, firstY: f, secondY: q }
        };
    };



    render() {
        const { page, widgets, graph, loading } = this.state;

        // if (loading) {
        //     return <Reloading />;
        // }
        return (
            <PageContext.Provider value={{ page: page, changePage: this.changePage, loading: loading }}>
                <div style={{
                    alignItems: 'center',
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.75)",
                    backgroundColor: '#f0ecec',
                    maxHeight: 80,
                    minHeight: 80,
                    position: "sticky",
                    top: 0,
                    display: 'flex',
                    justifyContent: "flex-start",
                    gap: "40px"
                }}>
                    <TimeOptions onDateChange={this.handleDateChange} />
                    <MeetingOptions onDateChange={this.handleMeetingDateChange} startDate={this.state.startDate} endDate={this.state.endDate} />
                    <PageOptions />
                </div>
                <div className="content-div">
                    <div className={page === "google" ? "nav-container" : "nav-container facebook"}>
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
                                <span style={{ backgroundColor: "#408cf4", color: "white", padding: "5px 10px", borderRadius: "10px" }}>F</span>acebook
                            </div>
                        ) : page === "referral" ? <h1>Referral</h1> : page === "cplead" ? <h1>CP Leads</h1>
                            : (
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "15px" }}>
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
                                        <span style={{ backgroundColor: "#408cf4", color: "white", padding: "5px 10px", borderRadius: "10px" }}>D</span>ata
                                    </div>
                                </div>
                            )}

                        {page !== "comparison" && (
                            <div style={{ padding: "5px", fontSize: "30px", fontWeight: 600 }}>Ads Performance</div>
                        )}
                    </div>

                    <div className="widget-container">
                        {widgets.map((widget, index) => (
                            <div key={widget.id || index} className={page === "google" ? "widget" : "widget facebook"}>
                                {loading ? <Reloading />
                                    : (
                                        <>
                                            <p className={page === "google" ? "widget-heading" : "widget-heading facebook"}>{widget.title}</p>
                                            <p className={page === "google" ? "widget-content" : "widget-content facebook"}>{widget.value}</p>
                                        </>
                                    )}
                            </div>
                        ))}
                    </div>

                    <GraphSection data={graph} google={this.state.google} fb={this.state.fb} referral={this.state.referral} cplead={this.state.cplead} q_google={this.state.q_google} q_fb={this.state.q_fb} q_referral={this.state.q_referral} q_cplead={this.state.q_cplead} m_google={this.state.m_google} m_fb={this.state.m_fb} m_referral={this.state.m_referral} m_cplead={this.state.m_cplead} />

                </div>
            </PageContext.Provider>
        );
    }
}