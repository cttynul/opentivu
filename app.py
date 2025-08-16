# app.py
from flask import Flask, Response, abort, jsonify
import requests
import re
import yaml

app = Flask(__name__)

GROUPS_MAP = {
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
}

def print_logo():
    logo = '''

                         _   _             
   ___  _ __   ___ _ __ | |_(_)_   ___   _ 
  / _ \| '_ \ / _ \ '_ \| __| \ \ / / | | |
 | (_) | |_) |  __/ | | | |_| |\ V /| |_| |
  \___/| .__/ \___|_| |_|\__|_| \_/  \__,_|
       |_|.api                               
                                  - cttynul
    '''
    print(logo)

print_logo

def get_m3u_content(country_code):
    m3u8_url = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8'
    italian_epg_url = 'https://tvit.leicaflorianrobert.dev/epg/list.xml'
    allowed_groups = GROUPS_MAP.get(country_code)
    if not allowed_groups and country_code != 'all':
        return None
    try:
        response = requests.get(m3u8_url)
        response.raise_for_status()
        m3u8_data = response.text
        lines = m3u8_data.split('\n')
        channels = []
        for i in range(len(lines)):
            line = lines[i]
            if line.startswith('#EXTINF:'):
                group_title_match = re.search(r'group-title="([^"]*)"', line)
                group_title = group_title_match.group(1) if group_title_match else ''
                if i + 1 < len(lines) and lines[i + 1].startswith('http'):
                    channels.append({
                        'meta': line,
                        'url': lines[i + 1],
                        'group': group_title
                    })
        filtered_channels = []
        if country_code == 'all':
            filtered_channels = channels
            filtered_channels.sort(key=lambda c: (c['group'] not in GROUPS_MAP['it'], c['group']))
        else:
            filtered_channels = [c for c in channels if c['group'] in allowed_groups]
        header = f'#EXTM3U url-tvg="{italian_epg_url}"\n' if country_code == 'it' else '#EXTM3U\n'
        filtered_m3u = header
        for channel in filtered_channels:
            filtered_m3u += f"{channel['meta']}\n{channel['url']}\n"
        return filtered_m3u
    except requests.exceptions.RequestException:
        return None

@app.route('/api/')
def api_how_to():
    how_to_message = {
        "message": "Welcome to opentivu API. To get a playlist, use the following format:",
        "usage": "/api/[country_code]",
        "example": "http://endpoint:5000/api/it",
        "available_countries": sorted(list(GROUPS_MAP.keys()))
    }
    return jsonify(how_to_message)

@app.route('/api/<country_code>')
def get_playlist(country_code):
    playlist_content = get_m3u_content(country_code)
    if playlist_content is None:
        return "Country code not supported.", 404
    if "Error" in playlist_content:
        return "Internal server error.", 500
    return Response(
        playlist_content,
        mimetype='application/x-mpegurl',
        headers={'Access-Control-Allow-Origin': '*'}
    )
if __name__ == '__main__':
    print_logo()
    with open('config.yml', 'r') as f:
        config = yaml.safe_load(f)
    server_config = config.get('server', {})
    host = server_config.get('host', '0.0.0.0')
    port = server_config.get('port', 5000)
    app.run(host=host, port=port)