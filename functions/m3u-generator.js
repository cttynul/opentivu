const groupsMap = {
    'al': ['Albania'],
    'ad': ['Andorra'],
    'ar': ['Argentina'],
    'am': ['Armenia'],
    'au': ['Australia'],
    'at': ['Austria'],
    'az': ['Azerbaijan'],
    'by': ['Belarus'],
    'be': ['Belgium'],
    'ba': ['Bosnia and Herzegovina'],
    'br': ['Brazil'],
    'bg': ['Bulgaria'],
    'ca': ['Canada'],
    'td': ['Chad'],
    'cl': ['Chile'],
    'cn': ['China'],
    'cr': ['Costa Rica'],
    'hr': ['Croatia'],
    'cy': ['Cyprus'],
    'cz': ['Czech Republic'],
    'dk': ['Denmark'],
    'do': ['Dominican Republic'],
    'eg': ['Egypt'],
    'ee': ['Estonia'],
    'fo': ['Faroe Islands'],
    'fi': ['Finland'],
    'fr': ['France'],
    'ge': ['Georgia'],
    'de': ['Germany'],
    'gr': ['Greece'],
    'gl': ['Greenland'],
    'hk': ['Hong Kong'],
    'hu': ['Hungary'],
    'is': ['Iceland'],
    'in': ['India'],
    'id': ['Indonesia'],
    'ir': ['Iran'],
    'iq': ['Iraq'],
    'ie': ['Ireland'],
    'il': ['Israel'],
    'it': ['Italy', 'VOD Italy'],
    'jp': ['æ—¥æœ¬/Japan'],
    'kr': ['Korea'],
    'xk': ['Kosovo'],
    'lv': ['Latvia'],
    'lt': ['Lithuania'],
    'lu': ['Luxembourg'],
    'mo': ['Macau'],
    'mt': ['Malta'],
    'mx': ['Mexico'],
    'md': ['Moldova'],
    'mc': ['Monaco'],
    'me': ['Montenegro'],
    'nl': ['Netherlands'],
    'kp': ['North Korea'],
    'mk': ['North Macedonia'],
    'no': ['Norway'],
    'py': ['Paraguay'],
    'pe': ['Peru'],
    'pl': ['Poland'],
    'pt': ['Portugal'],
    'qa': ['Qatar'],
    'ro': ['Romania'],
    'ru': ['Russia'],
    'sm': ['San Marino'],
    'sa': ['Saudi Arabia'],
    'rs': ['Serbia'],
    'sk': ['Slovakia'],
    'si': ['Slovenia'],
    'so': ['Somalia'],
    'es': ['Spain', 'Spain VOD'],
    'se': ['Sweden'],
    'ch': ['Switzerland'],
    'tw': ['Taiwan'],
    'tt': ['Trinidad'],
    'tr': ['Turkey'],
    'gb': ['UK'],
    'ua': ['Ukraine'],
    'ae': ['United Arab Emirates'],
    'us': ['USA', 'Usa VOD'],
    've': ['Venezuela'],
    'doc': ['Documentaries (AR)', 'Documentaries (EN)'],
    'movies': ['VOD Movies (EN)'],
    'news': ['News (AR)', 'News (ES)', 'News'],
    'business': ['Business'],
    'weather': ['Weather'],
    'all': []
};

exports.handler = async (event) => {
    const pathSegments = event.path.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    let countryCode = null;
    if (lastSegment && lastSegment !== 'm3u-generator') {
        countryCode = lastSegment.toLowerCase();
    }

    // Se non viene specificato un codice paese, restituisci un errore
    if (!countryCode) {
        return {
            statusCode: 404,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: 'Error: Country code not provided. Please use the format /api/[country_code].',
        };
    }
    
    // Controlla se il codice paese è valido
    const allowedGroups = groupsMap[countryCode];
    if (!allowedGroups && countryCode !== 'all') {
        return {
            statusCode: 404,
            body: 'Country code not supported.'
        };
    }

    const m3u8Url = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
    const italianEpgUrl = 'https://tvit.leicaflorianrobert.dev/epg/list.xml';

    try {
        const response = await fetch(m3u8Url);
        if (!response.ok) {
            throw new Error(`Error fetching playlist: ${response.statusText}`);
        }
        const m3u8Data = await response.text();

        const lines = m3u8Data.split('\n');
        const channels = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF:')) {
                const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                const groupTitle = groupTitleMatch ? groupTitleMatch[1] : '';

                if (lines[i + 1] && lines[i + 1].startsWith('http')) {
                    channels.push({
                        meta: line,
                        url: lines[i + 1],
                        group: groupTitle
                    });
                    i++;
                }
            }
        }
        
        let filteredChannels = [];
        
        if (countryCode === 'all') {
            filteredChannels = channels;

            filteredChannels.sort((a, b) => {
                const isAItalian = groupsMap['it'].includes(a.group);
                const isBItalian = groupsMap['it'].includes(b.group);
                
                if (isAItalian && !isBItalian) {
                    return -1;
                }
                if (!isAItalian && isBItalian) {
                    return 1;
                }
                
                return a.group.localeCompare(b.group);
            });
        } else {
            filteredChannels = channels.filter(channel => allowedGroups.includes(channel.group));
        }

        // Aggiungi il tag EPG solo se il codice del paese è 'it'
        const header = (countryCode === 'it') ? `#EXTM3U url-tvg="${italianEpgUrl}"\n` : '#EXTM3U\n';
        
        let filteredM3u = header;
        filteredChannels.forEach(channel => {
            filteredM3u += channel.meta + '\n' + channel.url + '\n';
        });

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