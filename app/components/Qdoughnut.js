class Qdoughnut extends React.Component {
    constructor(props) {
        super(props);
        this.chartInstance = null;
        this.state = {
            hasLeads: true
        };
    }

    componentDidMount() {
        this.renderChart();
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.googleLeads !== this.props.googleLeads ||
            prevProps.facebookLeads !== this.props.facebookLeads ||
            prevProps.referralLeads !== this.props.referralLeads ||
            prevProps.socialsLeads !== this.props.socialsLeads ||
            prevProps.cpleadLeads !== this.props.cpleadLeads ||
            prevProps.page !== this.props.page
        ) {
            this.destroyChart();
            this.renderChart();
        }
    }

    componentWillUnmount() {
        this.destroyChart();
    }

    destroyChart = () => {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
        }
    }

    renderChart = () => {
        const CHART_COLORS = {
            google: '#f08424',
            facebook: '#88bcfc',
            referral: ' #7d3c98 ',
            socials: '#fc10f0ff',
            cplead: ' #f1c40f '
        };

        const { googleLeads = 0, facebookLeads = 0,socialsLeads = 0,referralLeads = 0, cpleadLeads = 0, page } = this.props;

        let chartLabels = [];
        let chartData = [];
        let chartColors = [];

        if (page === "comparison") {
            chartLabels = ["Google", "Facebook","Socials","Referral", "CP Lead"];
            chartData = [googleLeads, facebookLeads,socialsLeads,referralLeads, cpleadLeads];
            chartColors = [CHART_COLORS.google, CHART_COLORS.facebook,CHART_COLORS.socials, CHART_COLORS.referral, CHART_COLORS.cplead];
        } else {
            const label = page.charAt(0).toUpperCase() + page.slice(1);
            chartLabels = [label];
            chartData = [page === "google" ? googleLeads : page == "referral" ? referralLeads : page == "socials" ? socialsLeads: page == "cplead" ? cpleadLeads : facebookLeads];
            chartColors = [CHART_COLORS[page]];
        }

        const totalLeads = chartData.reduce((sum, val) => sum + val, 0);
        const hasLeads = totalLeads > 0;

        this.setState({ hasLeads }); // update UI based on whether data exists

        if (!hasLeads) return;

        const data = {
            labels: chartLabels,
            datasets: [{
                label: 'Qualified Leads Distribution',
                data: chartData,
                backgroundColor: chartColors
            }]
        };

        const config = {
            type: 'doughnut',
            data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Qualified Leads Distribution'
                    },
                    tooltip: {
                        enabled: true
                    }
                }
            },
            plugins: [{
                id: 'arcLabels',
                afterDraw(chart) {
                    const { ctx, chartArea, data } = chart;
                    const meta = chart.getDatasetMeta(0);

                    ctx.save();
                    ctx.fillStyle = 'white';
                    ctx.font = '600 14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';

                    meta.data.forEach((arc, i) => {
                        const angle = (arc.startAngle + arc.endAngle) / 2;
                        const radius = (arc.outerRadius + arc.innerRadius) / 2;
                        const x = arc.x + Math.cos(angle) * radius;
                        const y = arc.y + Math.sin(angle) * radius;
                        const value = data.datasets[0].data[i];

                        ctx.fillText(value, x, y);
                    });

                    ctx.restore();
                }
            }]
        };

        const ctx = document.getElementById('qualifiedDoughnut')?.getContext('2d');
        if (ctx) {
            this.chartInstance = new Chart(ctx, config);
        }
    }

    render() {
        return (
            <>
                <div style={{ width: "100%", maxWidth: "400px", margin: "auto", padding: '40px' }}>
                    <canvas id='qualifiedDoughnut'></canvas>
                </div>
            </>
        );
    }
}
