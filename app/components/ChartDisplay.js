class ChartDisplay extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.myChart = null;
  }

  componentDidMount() {
    this.renderChart();
  }

  componentDidUpdate(prevProps) {
    const { labels, firstY, secondY } = this.props;

    if (
      prevProps.labels !== labels ||
      prevProps.firstY !== firstY ||
      prevProps.secondY !== secondY
    ) {
      if (this.myChart) {
        this.myChart.data.labels = labels;
        this.myChart.data.datasets[0].data = firstY;
        this.myChart.data.datasets[1].data = secondY;
        this.myChart.update();
      }
    }
  }

  componentWillUnmount() {
    if (this.myChart) {
      this.myChart.destroy();
    }
  }

  renderChart() {
    const { name, labels, firstY, secondY } = this.props;
    const ctx = this.canvasRef.current.getContext("2d");

    console.log("📊 Mounting ChartDisplay with data:", { labels, firstY, secondY });

    this.myChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            type: 'bar',
            label: 'Budget',
            yAxisID: 'Budget',
            data: firstY,
            backgroundColor: '#fc646c',
            borderColor: '#bf0b14'
          },
          {
            type: 'line',
            label: name,
            yAxisID: name,
            data: secondY,
            backgroundColor: '#3681d5',
            borderColor: '#2354a3'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            align: 'end'
          }
        },
        scales: {
          Budget: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Budget'
            }
          },
          [name]: { // ✅ Dynamic y-axis ID
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: name
            }
          }
        }
      }
    });
  }

  render() {
    const { labels, firstY, secondY } = this.props;
    console.log("🎨 Rendering ChartDisplay: ", { labels, firstY, secondY });

    return (
      <div
        className="chart-container"
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400
        }}
      >
        <canvas ref={this.canvasRef}></canvas>
      </div>
    );
  }
}
