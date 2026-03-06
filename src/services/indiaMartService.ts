import axios from 'axios';

export const indiaMartService = {
  async fetchLeads(apiKey: string) {
    try {
      const response = await axios.get('/api/indiamart/leads', {
        params: { key: apiKey }
      });
      
      // IndiaMART API returns data in a specific format
      // Usually it's an array of leads in response.data
      // Note: IndiaMART API response structure can vary, but typically it's an array.
      // We'll normalize it for our ERP.
      
      if (response.data && Array.isArray(response.data)) {
        return response.data.map((item: any) => ({
          name: item.SENDER_NAME || 'Unknown',
          company: item.SENDER_COMPANY || 'Unknown',
          email: item.SENDER_EMAIL || '',
          phone: item.SENDER_MOBILE || '',
          status: 'New',
          source: 'IndiaMART',
          external_id: item.UNIQUE_QUERY_ID
        }));
      }
      
      return [];
    } catch (error) {
      console.error('IndiaMART Service Error:', error);
      throw error;
    }
  }
};
