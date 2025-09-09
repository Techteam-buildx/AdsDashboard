class GraphSection extends React.Component {
    static contextType = window.PageContext;

    render() {
        const { page, loading } = this.context;
        const { 
            data, google,fb,referral,socials,cplead, q_google, q_fb,q_socials,q_referral,q_cplead, m_google, m_fb,m_socials,m_referral,m_cplead } = this.props;

        console.log('props in GraphSection: ', this.props);

        return (
            <>
                {
                    ((page != "google" && page != "facebook") && (page != "referral" && page!="cplead") && (page!="socials")) ? (
                        <div style={{ minHeight: "600px" }}>
                            {
                                loading ?
                                    <>
                                        <div style={{ position: 'relative', top: 110, textAlign: 'center', fontWeight: 600, width: "100%", color: "#1064fc", fontSize: "20px" }}>
                                            LOADING DATA...
                                        </div>
                                        <div style={{ width: "490px", height: '200px', borderRadius: "30px", boxShadow: '0 0 2px 2px rgba(0,0,0, 0.3)' }}>
                                            <Reloading />
                                        </div>
                                    </>
                                    :
                                    <div style={{ display: 'flex', justifyContent: "center", gap: "80px", width: "100%" }}>
                                        <Doughnut googleLeads={google} facebookLeads={fb} referralLeads={referral} socialsLeads={socials} cpleadLeads={cplead} page={page} />
                                        <Qdoughnut googleLeads={q_google} facebookLeads={q_fb} socialsLeads={q_socials} referralLeads={q_referral} cpleadLeads={q_cplead} page={page}/>
                                        <Mdoughnut googleLeads={m_google} facebookLeads={m_fb} socialsLeads={m_socials} referralLeads={m_referral} cpleadLeads={m_cplead} page={page} />
                                    </div>
                            }
                        </div>
                    )
                        : (
                            <>
                                <div className="graphs">
                                    <div style={{
                                        display: "flex", flex: 1, flexDirection: 'column',
                                        gap: "20px", width: "100%",
                                        paddingTop: "10px", paddingBottom: "10px", paddingRight: "5px"
                                    }}>
                                        <div className={page === "google" ? "sub-container" : "sub-container facebook"}>
                                            <p className={page === "google" ? "subheading" : "subheading facebook"}>
                                                Budget VS Leads
                                            </p>
                                        </div>
                                        {loading ?
                                            <div style={{ width: "100%", height: '200px', borderRadius: "30px", boxShadow: '0 0 2px 2px rgba(0,0,0, 0.3)' }}>
                                                <Reloading />
                                            </div>
                                            :
                                            <div className="graph-display">
                                                <ChartDisplay
                                                    name={"leads"}
                                                    labels={data.leads.labels}
                                                    firstY={data.leads.firstY}
                                                    secondY={data.leads.secondY}
                                                />
                                            </div>
                                        }
                                    </div>

                                    <div style={{
                                        display: "flex", flex: 1, flexDirection: 'column',
                                        gap: "20px", width: "100%",
                                        paddingTop: "10px", paddingBottom: "10px", paddingLeft: "5px"
                                    }}>
                                        <div className={page === "google" ? "sub-container" : "sub-container facebook"}>
                                            <p className={page === "google" ? "subheading" : "subheading facebook"}>
                                                Budget VS Meetings Fixed
                                            </p>
                                        </div>
                                        {loading ?
                                            <div style={{ width: "100%", height: '200px', borderRadius: "30px", boxShadow: '0 0 2px 2px rgba(0,0,0, 0.3)' }}>
                                                <Reloading />
                                            </div>
                                            :
                                            <div className="graph-display">
                                                <ChartDisplay
                                                    name={"meetings"}
                                                    labels={data.meetings.labels}
                                                    firstY={data.meetings.firstY}
                                                    secondY={data.meetings.secondY}
                                                />
                                            </div>
                                        }
                                    </div>
                                </div>

                                <div className="graphs">
                                    <div style={{
                                        display: "flex", flex: 1, flexDirection: 'column',
                                        gap: "20px", width: "100%",
                                        paddingTop: "10px", paddingBottom: "10px", paddingRight: "5px"
                                    }}>
                                        <div className={page === "google" ? "sub-container" : "sub-container facebook"}>
                                            <p className={page === "google" ? "subheading" : "subheading facebook"}>
                                                Budget VS Conversions
                                            </p>
                                        </div>
                                        {loading ?
                                            <div style={{ width: "100%", height: '200px', borderRadius: "30px", boxShadow: '0 0 2px 2px rgba(0,0,0, 0.3)' }}>
                                                <Reloading />
                                            </div>
                                            :
                                            <div className="graph-display">
                                                <ChartDisplay
                                                    name={"converted"}
                                                    labels={data.converted.labels}
                                                    firstY={data.converted.firstY}
                                                    secondY={data.converted.secondY}
                                                />
                                            </div>
                                        }
                                    </div>

                                    <div style={{
                                        display: "flex", flex: 1, flexDirection: 'column',
                                        gap: "20px", width: "100%",
                                        paddingTop: "10px", paddingBottom: "10px", paddingLeft: "5px"
                                    }}>
                                        <div className={page === "google" ? "sub-container" : "sub-container facebook"}>
                                            <p className={page === "google" ? "subheading" : "subheading facebook"}>
                                                Budget VS Qualified
                                            </p>
                                        </div>
                                        {loading ?
                                            <div style={{ width: "100%", height: '200px', borderRadius: "30px", boxShadow: '0 0 2px 2px rgba(0,0,0, 0.3)' }}>
                                                <Reloading />
                                            </div>
                                            :
                                            <div className="graph-display">
                                                <ChartDisplay
                                                    name={"clicks"}
                                                    labels={data.qualified.labels}
                                                    firstY={data.qualified.firstY}
                                                    secondY={data.qualified.secondY}
                                                />
                                            </div>
                                        }
                                    </div>
                                </div>
                            </>
                        )
                }
            </>
        );
    }
}
