class PageOptions extends React.Component {
    static contextType = window.PageContext;  

    handleOptionChange = (event) => {
        const selectedOption = event.target.value;
        console.log("Page changed to: ", selectedOption);
        this.context.changePage(selectedOption);
    };

    render() {
        const { page } = this.context;  
        return (
            <div style={{ width: "100%" }}>
                <p style={{ fontSize: "14px", fontWeight: 600, paddingLeft: "20px", position: 'relative', top: -8 }}>Dashboard:</p>
                <select
                    style={{ position: 'relative', top: -17, fontSize: "10px", marginLeft: '20px', width: "72%" }}
                    onChange={this.handleOptionChange}
                    value={page}   
                >
                    <option value="google">Google</option>
                    <option value="facebook">Facebook</option>
                    <option value='referral'>Referral</option>
                    <option value="cplead">CP Lead</option>
                    <option value="comparison">Combined View</option>
                    <option value="socials">Socials</option>
                </select>
            </div>
        );
    }
}
