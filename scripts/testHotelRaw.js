const axios = require('axios');

async function test() {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) {
    console.error('SERPAPI_API_KEY is not set in environment');
    process.exit(2);
  }

  const city = process.argv[2] || 'Mumbai';
  const checkIn = process.argv[3] || new Date().toISOString().split('T')[0];
  const checkOut = process.argv[4] || (() => { const d=new Date(); d.setDate(d.getDate()+2); return d.toISOString().split('T')[0]; })();

  try {
    const resp = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google_hotels',
        q: `hotels in ${city}`,
        check_in_date: checkIn,
        check_out_date: checkOut,
        adults: '2',
        currency: 'INR',
        gl: 'in',
        hl: 'en',
        api_key: apiKey,
      },
    });

    console.log('status:', resp.status);
    console.log('properties count:', (resp.data.properties || []).length);
    console.log('sample property:', (resp.data.properties || [])[0]);
  } catch (err) {
    console.error('request error:', err.toString());
    if (err.response) {
      console.error('response status:', err.response.status);
      console.error('response data:', err.response.data);
    }
  }
}

test();
