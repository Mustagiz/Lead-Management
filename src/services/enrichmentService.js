const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY;

export const enrichLead = async (companyName, country = '') => {
    if (!OPENAI_API_KEY) {
        console.warn('AI API Key not found. Enrichment disabled.');
        return null;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional lead enrichment assistant. Return ONLY a JSON object with the following fields: linkedin_url (string), revenue_range (string), and key_contacts (array of objects with name, title, and linkedin_profile). Do not include any other text.'
                    },
                    {
                        role: 'user',
                        content: `Find information for the following company: ${companyName}${country ? ' in ' + country : ''}.`
                    }
                ],
                temperature: 0.3
            })
        });

        const result = await response.json();
        if (result.choices && result.choices[0]) {
            const content = result.choices[0].message.content;
            return JSON.parse(content);
        }
        return null;
    } catch (error) {
        console.error('Enrichment failed:', error);
        return null;
    }
};
