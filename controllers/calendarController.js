const ical = require('node-ical');

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cachedEvents = null;
let lastFetchTime = 0;

function getConfiguredFeeds(){
    const feeds = [
        {
            name: 'Google',
            url: process.env.GOOGLE_ICS_URL,
            color: '#2563eb'
        },
        {
            name: 'iPhomne',
            url: process.env.IPHONE_ICS_URL,
            color: '#16a34a'
        },
        {
            name: 'Outlook',
            url: process.env.OUTLOOK_ICS_URL,
            color: '#d97706'
        }
    ];

    //Only include feeds that have a non-placeholder URL
    return feeds.filter(feed => feed.url && !feed.url.includes('YOUR_ICS_URL'));

}

async function fetchAndNormalizeEvents() {
    const feeds = getConfiguredFeeds();
    const rangeStart = new Date();
    rangeStart.setMonth(rangeStart.getMonth() - 1); // 1 month in the past
    const rangeEnd = new Date();
    rangeEnd.setMonth(rangeEnd.getMonth() + 3); // 3 months in the future

    const normalized = [];

    await Promise.all(
        feeds.map(async (feed) => {
            try { 
                const data = await ical.async.fromURL(feed.url);
                for (const item of Object.values(data)) {
                    if (item.type !== 'VEVENT') continue;
                    const instances = ical.expandRecurringEvent(item, {from: rangeStart, to: rangeEnd});
                    for (const instance of instances) {
                        normalized.push({
                            title: instance.summary || 'Busy',
                            start: instance.start,
                            end: instance.end,
                            allDay: Boolean(instance.isFullDay),
                            backgroundColor: feed.color,
                            borderColor: feed.color,
                            extendedProps: {
                                source: feed.name,
                                location: instance.location || ''
                            }
                        });
                    }
                }
            } catch (error) {
                console.error(`Error fetching or parsing feed ${feed.name}: ${error.message}`);
            }
        })
    );

    return normalized;
}

async function getEvents(req, res) {
    const now = Date.now();
    if (!cachedEvents || (now - lastFetchTime) > CACHE_TTL_MS) {
        try {
            cachedEvents = await fetchAndNormalizeEvents();
            lastFetchTime = now;
        } catch (error) {
            console.error('Error fetching events:', error);
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
    }
    res.json({ syncedAt: new Date(lastFetchTime).toISOString(), events: cachedEvents });
}

module.exports = {
    getEvents
};
