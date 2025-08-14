const groupsMap = {
    'it': ['Italy', 'VOD Italy'],
    'de': ['Germany'],
    'fr': ['France'],
    'es': ['Spain'],
    'us': ['USA']
};

exports.handler = async (event) => {
    // Estrae il codice paese dall'URL. Se non c'è, countryCode sarà null.
    const path = event.path;
    const countryCodeMatch = path.match(/\/m3u-generator\/([a-z]{2,})\/?$/);
    const countryCode = countryCodeMatch ? countryCodeMatch[1].toLowerCase() : null;

    // Se non viene specificato un codice paese, mostra l'help
    if (!countryCode) {
        const helpMessage = `
Welcome to the openTV m3u playlist generator!

To get a filtered M3U list, please use the following URL format:

https://opentv.netlify.app/api/[country_code]

Available country codes:
- it (Italy)
- de (Germany)
- fr (France)
- es (Spain)
- us (USA)

Example:
https://opentv.netlify.app/api/it
        `;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain',
                'Access-Control-Allow-Origin': '*'
            },
            body: helpMessage,
        };
    }

    const allowedGroups = groupsMap[countryCode];
    
    if (!allowedGroups) {
        return {
            statusCode: 404,
            body: 'Country code not supported.'
        };
    }
    
    const m3u8Url = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
    
    try {
        const response = await fetch(m3u8Url);
        if (!response.ok) {
            throw new Error(`Error fetching playlist: ${response.statusText}`);
        }
        const m3u8Data = await response.text();

        let filteredM3u = '#EXTM3U\n';
        const lines = m3u8Data.split('\n');
        
        let isChannelLine = false;
        for (const line of lines) {
            if (line.startsWith('#EXTINF:')) {
                const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                const groupTitle = groupTitleMatch ? groupTitleMatch[1] : '';
                isChannelLine = allowedGroups.includes(groupTitle);
                
                if (isChannelLine) {
                    filteredM3u += line + '\n';
                }
            } else if (isChannelLine && line.startsWith('http')) {
                filteredM3u += line + '\n';
                isChannelLine = false;
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/x-mpegurl',
                'Access-Control-Allow-Origin': '*'
            },
            body: filteredM3u,
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal server error.'
        };
    }
};