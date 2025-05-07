const axios = require('axios');

const API_KEY = process.env.FRESHERWORKS_API_KEY;
const BASE_URL = 'https://buildx-org.myfreshworks.com/crm/sales/api/contacts/filters';

async function getLeads() {
    try {
        const APP_URI = 'https://domain.myfreshworks.com/crm/sales/api/contacts/view/402010046244'
        const response = await axios.get(BASE_URL, {
            headers: {
                'Authorization': `Token token=${API_KEY}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        const leads = response.data.filters;
        console.log(leads);
        let cnt = 0;
        for (let x of leads) {
            for (let y of x) {
                cnt++;
            }
        }
        console.log(cnt);
        return leads;

    } catch (error) {
        console.error("Error fetching leads:", error?.response?.data || error.message);
        return [];
    }
}

getLeads();