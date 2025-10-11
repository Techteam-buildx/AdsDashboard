class DynamicTable extends React.Component {
  computeRatioArray(numerator, denominator) {
    if (!Array.isArray(numerator) || !Array.isArray(denominator)) {
      throw new Error("Both arguments must be arrays.");
    }

    const length = Math.max(numerator.length, denominator.length);

    return Array.from({ length }, (_, i) => {
      const num = numerator[i] ?? 0;
      const den = denominator[i] ?? 0;
      if (den === 0) return 0;
      return parseFloat((num / den).toFixed(0));
    });
  }




  render() {
    let { loading } = this.context;
    const { propObj,page,load } = this.props;
    if(loading || load){
      return <p style={styles.noData}>Loading...</p>
    }

    if (!propObj || Object.keys(propObj).length === 0) {
      return <p style={styles.noData}>No data available</p>;
    }

    const budget = propObj.leads.firstY.map(num => Math.trunc(num));
    const leads = propObj.leads.secondY;
    const meetings = propObj.meetings.secondY;
    const conversions = propObj.converted.secondY;
    const qualified = propObj.qualified.secondY;
    const intervals = propObj.leads.labels;

    const data = {
      Interval: intervals,
      Budget: budget,
      Leads: leads,
      "Cost/Lead": this.computeRatioArray(budget, leads),
      Meetings: meetings,
      "Cost/Meeting": this.computeRatioArray(budget, meetings),
      Qualified: qualified,
      "Cost/Qualified": this.computeRatioArray(budget , qualified),
      Conversions: conversions,
      "Cost/Conversion": this.computeRatioArray(budget, conversions),
    };

    if (!data || Object.keys(data).length === 0) {
      return <p style={styles.noData}>No data available</p>;
    }

    const columns = Object.keys(data);
    const numRows = Math.max(...columns.map((col) => data[col].length));

    return (
      <>
        {loading || data?.Interval.length ==0 ? (
          <div>Loading...</div>
        ) : (
          <div style={styles.wrapper}>
            {/* <h1>{page+" "+interval}</h1> */}
            <style>{cssStyles}</style>
            <div className="table-container fade-in">
              <table className="styled-table">
                <thead>
                  <tr>
                    {columns.map((col, idx) => (
                      <th key={idx}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {Array.from({ length: numRows })
                  .map((_, rowIndex) => numRows - 1 - rowIndex) // reverse index
                  .map((revIndex) => (
                    <tr key={revIndex}>
                      {columns.map((col, colIndex) => (
                        <td key={colIndex}>
                          {data[col]?.[revIndex] ?? ""}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>

              </table>
            </div>
          </div>
        )}
      </>
    );
  }
}

// Inline styles and CSS as string
const styles = {
  wrapper: {
    width: "100%",
    fontFamily: "Poppins, sans-serif",
  },
  noData: {
    textAlign: "center",
    color: "#666",
    marginTop: "20px",
    fontFamily: "Poppins, sans-serif",
  },
};

const cssStyles = `
.table-container {
  z-index:-8;  
  max-height: 35vh;
  overflow-y: auto;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background-color: #fff;
  animation: slide-up 0.6s ease;
}

/* Fade-in + slide-up animation */
.fade-in {
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-up {
  from {
    transform: translateY(10px);
  }
  to {
    transform: translateY(0);
  }
}

.styled-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
  color: #333;
  border-radius: 12px;
}

.styled-table thead {
  background-color: #0078d7;
  color: #fff;
  position: sticky;
  top: 0;
  z-index: 1;
}

.styled-table th,
.styled-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  transition: background-color 0.3s ease;
}

.styled-table tbody tr:hover {
  background-color: rgba(0, 120, 215, 0.1);
  transition: background-color 0.3s ease;
}

/* Scrollbar customization */
.table-container::-webkit-scrollbar {
  width: 8px;
}

.table-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background-color: rgba(0, 0, 0, 0.4);
}
`;
