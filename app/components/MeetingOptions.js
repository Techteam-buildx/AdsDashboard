class MeetingOptions extends React.Component {
    constructor(props) {
        super(props);
        const today = this.getDate();
        this.state = {
            selectedOption: "",
            startDate: this.props.startDate || today,
            endDate: this.props.endDate || today
        };
    }

    getDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    getFormattedDate(date) {
        return date.toISOString().split("T")[0];
    }

    handleOptionChange = (event) => {
        const selectedOption = event.target.value;
        const today = new Date();
        const oneDay = 24 * 60 * 60 * 1000;
        let startDate = "";
        let endDate = this.getFormattedDate(today);

        if (selectedOption === "today") {
            startDate = endDate;
        } else if (selectedOption === "lastWeek") {
            startDate = this.getFormattedDate(new Date(today - 7 * oneDay));
        } else if (selectedOption === "lastMonth") {
            startDate = this.getFormattedDate(
                new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
            );
        } else if (selectedOption === "lastYear") {
            startDate = this.getFormattedDate(
                new Date(today.getFullYear() - 1, today.getMonth(), today.getDate())
            );
        }

        if (selectedOption !== "custom") {
            this.setState({ selectedOption, startDate, endDate }, () => {
                if (this.props.onDateChange) {
                    this.props.onDateChange(startDate, endDate);
                }
            });
        } else {
            this.setState({ selectedOption, startDate: "", endDate: "" });
        }
    };

    handleStartDateChange = (event) => {
        const startDate = event.target.value;
        this.setState({ startDate, endDate: "", selectedOption: "custom" });
    };

    handleEndDateChange = (event) => {
        const endDate = event.target.value;
        this.setState({ endDate, selectedOption: "custom" });
    };

    handleSubmitCustomDates = () => {
        if (this.state.startDate && this.state.endDate && this.props.onDateChange) {
            this.props.onDateChange(this.state.startDate, this.state.endDate);
        }
    };

    render() {
        const { selectedOption, startDate, endDate } = this.state;

        return (
            <div style={{ width: "100%" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, paddingLeft: "20px", position: 'relative', top: -8 }}>
                    Check Meetings:
                </p>
                <select
                    style={{ width: "80%", position: 'relative', top: -17, fontSize: "10px", marginLeft: '20px' }}
                    value={selectedOption}
                    onChange={this.handleOptionChange}
                >
                    <option value="" disabled hidden>Choose</option>
                    <option value="today">Today</option>
                    <option value="lastWeek">Last Week</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="lastYear">Last Year</option>
                    <option value="custom">Custom</option>
                </select>


                {selectedOption === "custom" && (
                    <div style={{ display: "flex", gap: "6px", paddingLeft: "20px", position: 'relative', top: -10 }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <input
                                type="date"
                                value={startDate}
                                onChange={this.handleStartDateChange}
                                style={{ fontSize: '10px' }}
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={this.handleEndDateChange}
                                disabled={!startDate}
                                min={startDate}
                                style={{ fontSize: '10px' }}
                            />
                        </div>
                        <button
                            style={{ fontSize: "10px", padding: "2px 8px", width: "fit-content", display: 'block' }}
                            disabled={!startDate || !endDate}
                            onClick={this.handleSubmitCustomDates}
                        >
                            See Data
                        </button>
                    </div>
                )}
            </div>
        );
    }
}


