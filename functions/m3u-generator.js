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

// Mappa per la ridenominazione specifica dei canali prima della pulizia generale
const channelRenamingMap = {
    "20 Mediaset Ⓖ": "Mediaset 20",
    "27 Twentyseven Ⓖ": "Twenty Seven"
};

// Funzione principale della Netlify Function
exports.handler = async (event) => {
    // Estrae il codice del paese dai parametri del percorso
    const pathSegments = event.path.split('/').filter(Boolean);
    const lastSegment = pathSegments[pathSegments.length - 1];

    let countryCode = null;
    if (lastSegment && lastSegment !== 'm3u-generator') {
        countryCode = lastSegment.toLowerCase();
    }

    // Se non viene specificato un codice paese, reindirizza alla pagina di aiuto
    if (!countryCode) {
        return {
            statusCode: 302,
            headers: {
                'Location': `${event.path}/help`,
            },
            body: ''
        };
    }
    
    // Gestione della richiesta 'help'
    if (countryCode === 'help') {
        const helpText = `
opentivu m3u8 generator API
--------------------------

This API generates a filtered M3U8 playlist based on a country code or provides EPG data.

Usage:
/api/[country_code]

Parameters:
[country_code] - A two-letter country code (e.g., 'it' for Italy) or 'epg' for EPG data.

Available country codes:
${Object.keys(groupsMap).map(code => ` - ${code.toUpperCase()}`).join('\n')}
 - EPG

Example:
To get all Italian channels, use: /api/it
To get all available channels, use: /api/all
To get the combined EPG data, use: /api/epg

Note: This API is for personal use and provides a list of publicly and free-to-air available TV streams.
        `;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/plain' },
            body: helpText,
        };
    }

    // Gestione della richiesta 'epg'
    if (countryCode === 'epg') {
        const italianEpgUrl = 'https://tvit.leicaflorianrobert.dev/epg/list.xml';
        const plutoEpgUrl = 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/PlutoTV/it.xml';

        try {
            const [italianEpgResponse, plutoEpgResponse] = await Promise.all([
                fetch(italianEpgUrl),
                fetch(plutoEpgUrl)
            ]);

            if (!italianEpgResponse.ok || !plutoEpgResponse.ok) {
                throw new Error('Errore durante il recupero di uno o entrambi i file EPG.');
            }

            const italianEpgXml = await italianEpgResponse.text();
            const plutoEpgXml = await plutoEpgResponse.text();

            const extractContent = (xmlString) => {
                return xmlString.replace(/<\?xml[^>]*\?>/g, '')
                                .replace(/<!DOCTYPE[^>]*>/g, '')
                                .replace(/<tv[^>]*>|<\/tv>/g, '')
                                .trim();
            };

            const italianContent = extractContent(italianEpgXml);
            const plutoContent = extractContent(plutoEpgXml);
            
            const combinedEpg = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE tv SYSTEM "xmltv.dtd">
<tv>
${italianContent}
${plutoContent}
</tv>`;

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/xml',
                    'Access-Control-Allow-Origin': '*'
                },
                body: combinedEpg,
            };

        } catch (error) {
            console.error('Errore durante l\'unione dei file EPG:', error);
            return {
                statusCode: 500,
                body: 'Errore interno del server durante l\'unione dei file EPG.'
            };
        }
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
    const plutoEpgUrl = 'https://raw.githubusercontent.com/matthuisman/i.mjh.nz/master/PlutoTV/it.xml';


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

                const channelNameMatch = line.match(/,(.*)$/);
                const originalChannelName = channelNameMatch ? channelNameMatch[1].trim() : '';

                if (lines[i + 1] && lines[i + 1].startsWith('http')) {
                    channels.push({
                        meta: line,
                        url: lines[i + 1],
                        group: groupTitle,
                        name: originalChannelName
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

        const header = (countryCode === 'it') 
            ? `#EXTM3U url-tvg="${italianEpgUrl},${plutoEpgUrl}"\n` 
            : '#EXTM3U\n';
        
        let filteredM3u = header;
        filteredChannels.forEach(channel => {
            let cleanName = channel.name;

            // Applica la ridenominazione esatta prima della pulizia
            if (channelRenamingMap[cleanName]) {
                cleanName = channelRenamingMap[cleanName];
            }
            
            // Pulizia dei caratteri speciali e indicatori
            cleanName = cleanName
                .replace(/ \u24d8|\u24bc|\u24c8|\u24df|\u24e2|\u24d5|\u24e6|\u24d1|\u24e5|\u24dc|\u24d0|\u24e7|\u24d9|\u24d7|\u24e8|\u24d4|\u24e4|\u24dd|\u24d6|\u24e1|\u24e3|\u24db|\u24da|\u24e0|\u24de|\u24e9/g, '')
                .replace(/ – Pluto TV/g, '') 
                .trim();

            let tvgId = cleanName.replace(/ /g, '').replace(/[\W_]+/g, '') + '.it';

            let newMeta = channel.meta.replace(/tvg-id="[^"]*"/, `tvg-id="${tvgId}"`);
            newMeta = newMeta.replace(/tvg-name="[^"]*"/, `tvg-name="${cleanName}"`);
            newMeta = newMeta.replace(/,.*$/, `,${cleanName}`);

            filteredM3u += newMeta + '\n' + channel.url + '\n';
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
