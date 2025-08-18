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
    'jp': ['Japan'],
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

// Funzione di gestione della richiesta
export async function onRequest({ params }) {
    const { country_code } = params;

    // Se country_code è vuoto, reindirizza a /api/help
    if (!country_code) {
        return new Response(null, {
            status: 302, // 302 Found (Temporary Redirect)
            headers: {
                'Location': '/api/help',
            },
        });
    }

    // Se country_code è "help", visualizza la pagina di aiuto
    if (country_code.toLowerCase() === 'help') {
        const helpText = `
opentivu m3u8 generator API
--------------------------

This API generates a filtered M3U8 playlist based on a country code.

Usage:
/api/[country_code]

Parameters:
[country_code] - A two-letter country code (e.g., 'it' for Italy).

Available country codes:
${Object.keys(groupsMap).map(code => ` - ${code.toUpperCase()}`).join('\n')}

Example:
To get all Italian channels, use: /api/it
To get all available channels, use: /api/all

Note: This API is for personal use and provides a list of publicly and free-to-air available TV streams.
        `;

        return new Response(helpText, {
            status: 200,
            headers: { 'Content-Type': 'text/plain' },
        });
    }

    // Il resto del codice per generare la M3U8...
    const countryCode = country_code.toLowerCase();

    const allowedGroups = groupsMap[countryCode];
    if (!allowedGroups && countryCode !== 'all') {
        return new Response('Country code not supported.', { status: 404 });
    }

    const m3u8Url = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';

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

        const italianEpgUrl = 'https://tvit.leicaflorianrobert.dev/epg/list.xml';
        const plutoEpgUrl = 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/PlutoTV/it.xml';

        const header = (countryCode === 'it') 
            ? `#EXTM3U url-tvg="${italianEpgUrl},${plutoEpgUrl}"\n` 
            : '#EXTM3U\n';
        
        let filteredM3u = header;
        filteredChannels.forEach(channel => {
            filteredM3u += channel.meta + '\n' + channel.url + '\n';
        });

        return new Response(filteredM3u, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-mpegurl',
                'Access-Control-Allow-Origin': '*'
            },
        });

    } catch (error) {
        console.error(error);
        return new Response('Internal server error.', { status: 500 });
    }
}