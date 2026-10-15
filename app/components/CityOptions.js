class CityOptions extends React.Component {
    handleOptionChange = (event) => {
        this.props.onCityChange(event.target.value);
    };

    render() {
        const { city, cities } = this.props;
        return (
            <div style={{ width: "100%" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, paddingLeft: "20px", position: 'relative', top: -8 }}>City:</p>
                <select
                    style={{ position: 'relative', top: -17, fontSize: "10px", marginLeft: '20px', width: "72%" }}
                    onChange={this.handleOptionChange}
                    value={city}
                >
                    <option value="">All Cities</option>
                    {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>
        );
    }
}
