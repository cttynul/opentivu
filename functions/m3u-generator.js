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
    'jp': ['日本/Japan'],
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
    'all': [] // Aggiungi il codice 'all' alla mappa, ma lo gestiremo in modo speciale
};

exports.handler = async (event) => {
    // Estrae il codice paese dal percorso della richiesta in modo robusto.
    // L'URL dopo il reindirizzamento è del tipo: "/.netlify/functions/m3u-generator/it"
    const pathSegments = event.path.split('/').filter(Boolean);

    // L'ultimo segmento dell'URL dovrebbe essere il codice paese.
    // Se l'ultimo segmento è il nome della funzione, significa che non c'è codice paese.
    const lastSegment = pathSegments[pathSegments.length - 1];

    let countryCode = null;
    if (lastSegment && lastSegment !== 'm3u-generator') {
        countryCode = lastSegment.toLowerCase();
    }

    // Se non viene specificato un codice paese, mostra l'help
    if (!countryCode) {
        const availableCountries = Object.keys(groupsMap).sort().map(code => {
            const groups = groupsMap[code];
            const displayNames = groups.map(group => {
                // Rimuove '(AR)', '(EN)', ecc. per una visualizzazione più pulita
                const cleanName = group.replace(/\s*\(.*\)/, '').replace(/VOD\s*/, '');
                return cleanName;
            }).join(', ');
            
            return `- ${code} (${displayNames || 'Tutti i canali'})`;
        }).join('\n');

        const helpMessage = `
Welcome to the opentivu m3u playlist generator!

To get a filtered M3U list, please use the following URL format:

https://opentivu.netlify.app/api/[country_code]

Available country codes:
${availableCountries}

Example:
https://opentivu.netlify.app/api/it
        `;
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            },
            body: helpMessage,
        };
    }

    // Gestione speciale per il codice 'all'
    let allowedGroups = groupsMap[countryCode];
    let isAllRequest = countryCode === 'all';
    
    // Se non è una richiesta 'all' e il codice non è supportato, restituisci un errore.
    if (!isAllRequest && !allowedGroups) {
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

        // Canali italiani
        const italianChannels = groupsMap['it'];
        // Liste temporanee per i canali
        const primaryList = []; // Per i canali italiani
        const secondaryList = []; // Per tutti gli altri canali

        let isPrimaryChannel = false; // Flag per i canali italiani
        let isSecondaryChannel = false; // Flag per gli altri canali

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.startsWith('#EXTINF:')) {
                const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                const groupTitle = groupTitleMatch ? groupTitleMatch[1] : '';

                if (isAllRequest) {
                    // Logica per 'all': verifica se il canale è italiano o no
                    isPrimaryChannel = italianChannels.includes(groupTitle);
                    isSecondaryChannel = !isPrimaryChannel;
                } else {
                    // Logica per i singoli paesi
                    isPrimaryChannel = allowedGroups.includes(groupTitle);
                    isSecondaryChannel = false; // Non usato in questo caso
                }

                if (isPrimaryChannel) {
                    primaryList.push(line);
                    // Aggiungi la riga successiva (l'URL)
                    if (lines[i + 1] && lines[i + 1].startsWith('http')) {
                        primaryList.push(lines[i + 1]);
                        i++; // Salta la riga successiva
                    }
                } else if (isSecondaryChannel) {
                    secondaryList.push(line);
                    // Aggiungi la riga successiva (l'URL)
                    if (lines[i + 1] && lines[i + 1].startsWith('http')) {
                        secondaryList.push(lines[i + 1]);
                        i++; // Salta la riga successiva
                    }
                } else {
                    // Logica per i singoli paesi, se il canale non è tra quelli consentiti
                    isPrimaryChannel = false;
                }
            }
        }
        
        // Costruisci la playlist finale
        if (isAllRequest) {
            filteredM3u += primaryList.join('\n') + '\n' + secondaryList.join('\n');
        } else {
            // Se non è una richiesta 'all', usa la logica di filtraggio originale
            filteredM3u += primaryList.join('\n');
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