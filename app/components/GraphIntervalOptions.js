class GraphIntervalOptions extends React.Component {
    static contextType = window.PageContext;  

    handleOptionChange = (event) => {
        const selectedOption = event.target.value;
        console.log("Interval changed to: ", selectedOption);
        this.context.changeGraphInterval(selectedOption);
    };

    render() {
        const { graphInterval } = this.context;  
        return (
            <div style={{ width: "100%" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, paddingLeft: "20px", position: 'relative', top: -8 }}>Graph Interval:</p>
                <select
                    style={{ position: 'relative', top: -17, fontSize: "10px", marginLeft: '20px', width: "72%" }}
                    onChange={this.handleOptionChange}
                    value={graphInterval}   
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value='monthly'>Monthly</option>
                </select>
            </div>
        );
    }
}
