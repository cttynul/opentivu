document.addEventListener('DOMContentLoaded', () => {
    const m3u8Url = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
    const channelListContainer = document.getElementById('channel-list');
    const videoElement = document.getElementById('video-player');
    const videoPlayerContainer = document.getElementById('video-player-container');
    const navLinksMenu = document.getElementById('nav-links-menu');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const mainTitle = document.getElementById('main-title');
    
    const disclaimerModal = document.getElementById('disclaimerModal');
    const apiModal = document.getElementById('apiModal');
    const footerDisclaimerLink = document.getElementById('footer-disclaimer-link');
    const navbar = document.getElementById('navbar');
    const footer = document.getElementById('footer');
    const channelDropdown = document.getElementById('channel-dropdown');

    let hls;
    let allChannels = {};
    let currentGroupChannels = [];
    const relevantGroups = ['Italy', 'Germany', 'France', 'Spain', 'USA'];

    const body = document.body;

    function turnLightsOff() {
        if (!body.classList.contains('lights-off')) {
            body.classList.add('lights-off');
            channelListContainer.classList.add('lights-off');
            navbar.classList.add('lights-off');
            footer.classList.add('lights-off');
            
            const channelSelectorContainer = document.getElementById('channel-selector-container');
            if (channelSelectorContainer) {
                channelSelectorContainer.classList.add('lights-off');
            }

            const lightToggleButton = document.querySelector('[data-action="toggle-lights"]');
            if (lightToggleButton) {
                lightToggleButton.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Normal';
            }
        }
    }

    function turnLightsOn() {
        if (body.classList.contains('lights-off')) {
            body.classList.remove('lights-off');
            channelListContainer.classList.remove('lights-off');
            navbar.classList.remove('lights-off');
            footer.classList.remove('lights-off');
            
            const channelSelectorContainer = document.getElementById('channel-selector-container');
            if (channelSelectorContainer) {
                channelSelectorContainer.classList.remove('lights-off');
            }
            
            const lightToggleButton = document.querySelector('[data-action="toggle-lights"]');
            if (lightToggleButton) {
                lightToggleButton.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Immersive';
            }
        }
    }

    function getFlagUrl(countryName) {
        const countryCode = {
            'Italy': 'it', 'Germany': 'de', 'France': 'fr', 'Spain': 'es', 'USA': 'us',
            'United Kingdom': 'gb', 'Albania': 'al', 'Austria': 'at', 'Belgium': 'be',
            'Brazil': 'br', 'Bulgaria': 'bg', 'Canada': 'ca', 'China': 'cn',
            'Colombia': 'co', 'Croatia': 'hr', 'Denmark': 'dk', 'Finland': 'fi',
            'Greece': 'gr', 'Hungary': 'hu', 'India': 'in', 'Indonesia': 'id',
            'Ireland': 'ie', 'Israel': 'il', 'Japan': 'jp', 'Mexico': 'mx',
            'Netherlands': 'nl', 'Norway': 'no', 'Poland': 'pl', 'Portugal': 'pt',
            'Romania': 'ro', 'Russia': 'ru', 'Saudi Arabia': 'sa', 'Serbia': 'rs',
            'Sweden': 'se', 'Switzerland': 'ch', 'Turkey': 'tr', 'Ukraine': 'ua',
            'Other TVs': 'un'
        };
        const code = countryCode[countryName] ? countryCode[countryName] : 'un';
        return `https://flagcdn.com/20x15/${code}.png`;
    }

    function filterAndSortChannels(lines) {
        const channelsByGroup = {};
        let currentChannel = {};

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('#EXTINF:')) {
                const groupTitleMatch = line.match(/group-title="([^"]*)"/);
                const groupTitle = groupTitleMatch ? groupTitleMatch[1] : '';

                if (groupTitle) {
                    const tvgNameMatch = line.match(/tvg-name="([^"]*)"/);
                    const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/);

                    currentChannel = {
                        name: tvgNameMatch ? tvgNameMatch[1] : 'Nome Sconosciuto',
                        logo: tvgLogoMatch ? tvgLogoMatch[1] : '',
                        group: groupTitle,
                        url: ''
                    };
                }
            } else if (line.startsWith('http') && Object.keys(currentChannel).length > 0) {
                currentChannel.url = line;
                if (!channelsByGroup[currentChannel.group]) {
                    channelsByGroup[currentChannel.group] = [];
                }
                channelsByGroup[currentChannel.group].push(currentChannel);
                currentChannel = {};
            }
        }
        return channelsByGroup;
    }

    function generateNavMenu(groups) {
        const relevantGroups = ['Italy', 'Germany', 'France', 'Spain', 'USA'];
        const italyIndex = relevantGroups.indexOf('Italy');
        if (italyIndex > -1) {
            const italy = relevantGroups.splice(italyIndex, 1)[0];
            relevantGroups.unshift(italy);
        }

        const otherGroups = groups.filter(g => !relevantGroups.includes(g)).sort();
        const allGroups = relevantGroups.concat(otherGroups);

        const dropdownLi = document.createElement('li');
        dropdownLi.className = 'nav-link dropdown';
        const dropdownToggle = document.createElement('a');
        dropdownToggle.href = '#';
        dropdownToggle.className = 'dropdown-toggle';
        dropdownToggle.textContent = 'TVs ▼';
        dropdownToggle.dataset.group = 'TVs';

        const globeIcon = document.createElement('i');
        globeIcon.className = 'fa-solid fa-earth-europe';
        dropdownToggle.prepend(globeIcon);

        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu';

        allGroups.forEach(group => {
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = group;
            a.dataset.group = group;

            const flag = document.createElement('img');
            flag.className = 'flag-icon';
            flag.src = getFlagUrl(group);
            flag.alt = `Bandiera ${group}`;

            a.prepend(flag);
            dropdownMenu.appendChild(a);
        });

        dropdownLi.appendChild(dropdownToggle);
        dropdownLi.appendChild(dropdownMenu);
        navLinksMenu.appendChild(dropdownLi);
        
        const lightToggleLi = document.createElement('li');
        lightToggleLi.className = 'nav-link';
        const lightToggleLink = document.createElement('a');
        lightToggleLink.href = '#';
        lightToggleLink.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Immersive';
        lightToggleLink.dataset.action = 'toggle-lights';
        lightToggleLi.appendChild(lightToggleLink);
        navLinksMenu.appendChild(lightToggleLi);

        const apiLi = document.createElement('li');
        apiLi.className = 'nav-link';
        const apiLink = document.createElement('a');
        apiLink.href = '#';
        apiLink.innerHTML = '<i class="fa-solid fa-code"></i> API';
        apiLink.dataset.action = 'open-api-modal';
        apiLi.appendChild(apiLink);
        navLinksMenu.appendChild(apiLi);

        const disclaimerLi = document.createElement('li');
        disclaimerLi.className = 'nav-link';
        const disclaimerLink = document.createElement('a');
        disclaimerLink.href = '#';
        disclaimerLink.innerHTML = '<i class="fa-solid fa-circle-info"></i> Disclaimer';
        disclaimerLink.dataset.action = 'open-disclaimer-modal';
        disclaimerLi.appendChild(disclaimerLink);
        navLinksMenu.appendChild(disclaimerLi);
    }
    
    function populateChannelDropdown(channels, selectedChannel) {
        channelDropdown.innerHTML = '';
        
        channels.forEach(channel => {
            const option = document.createElement('option');
            option.value = channel.url;
            option.textContent = channel.name;
            option.dataset.name = channel.name;
            if (channel.name === selectedChannel.name) {
                option.selected = true;
            }
            channelDropdown.appendChild(option);
        });
    }

    function displayChannels(channels, groupName) {
        channelListContainer.innerHTML = '';
        
        let channelsToDisplay = channels;
        if (groupName === 'Italy' && allChannels['VOD Italy']) {
            channelsToDisplay = channelsToDisplay.concat(allChannels['VOD Italy']);
        }

        if (groupName === 'TVs') {
            channelsToDisplay = allChannels['Italy'];
            groupName = 'Italy';
        }

        let channelToPlay = channelsToDisplay[0];
        if (groupName === 'Italy') {
            const realTimeChannel = channelsToDisplay.find(c => c.name.toLowerCase().includes('real time'));
            if (realTimeChannel) {
                channelToPlay = realTimeChannel;
            }
        }
        
        if (!channelToPlay) {
             channelListContainer.innerHTML = '<p style="text-align: center; color: red;">Nessun canale trovato per questo gruppo.</p>';
             return;
        }

        // riga rimossa: mainTitle.style.display = 'none';
        
        channelDropdown.style.display = 'inline-block';
        
        populateChannelDropdown(channelsToDisplay, channelToPlay);
        
        if (!channelsToDisplay || channelsToDisplay.length === 0) {
            channelListContainer.innerHTML = '<p style="text-align: center; color: red;">Nessun canale trovato per questo gruppo.</p>';
            return;
        }

        let initialChannelSelected = false;

        channelsToDisplay.forEach(channel => {
            const channelItem = document.createElement('div');
            channelItem.className = 'channel-item';
            channelItem.dataset.url = channel.url;
            channelItem.dataset.name = channel.name;

            if (!initialChannelSelected && channel.name === channelToPlay.name) {
                channelItem.classList.add('selected-channel');
                initialChannelSelected = true;
            }

            const logo = document.createElement('img');
            logo.className = 'channel-logo';
            logo.src = channel.logo || 'https://via.placeholder.com/80x80.png?text=No+Logo';
            logo.alt = channel.name;

            const name = document.createElement('p');
            name.className = 'channel-name';
            name.textContent = channel.name;

            channelItem.appendChild(logo);
            channelItem.appendChild(name);

            channelItem.addEventListener('click', () => {
                document.querySelectorAll('.channel-item').forEach(item => {
                    item.classList.remove('selected-channel');
                });
                channelItem.classList.add('selected-channel');

                channelDropdown.value = channel.url;

                playChannel(channel.url);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            channelListContainer.appendChild(channelItem);
        });

        if (channelToPlay) {
            playChannel(channelToPlay.url);
        }
    }

    function playChannel(url) {
        const selectedOption = channelDropdown.options[channelDropdown.selectedIndex];
        const channelName = selectedOption ? selectedOption.dataset.name : 'Unknown';
        const errorMessage = `<div style="text-align: center; color: white; padding: 20px;">
                                <p style="font-size: 1.2em;">Can't load channel into webplayer.</p>
                                <p>Channel may be geoblocked or embedded is not permitted.</p>
                                <p>Try using a desktop player like VLC.</p>
                              </div>`;

        if (url.includes('youtube.com')) {
            const videoIdMatch = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
            if (videoIdMatch) {
                const videoId = videoIdMatch[1];
                const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0`;

                if (hls) {
                    hls.destroy();
                    hls = null;
                }
                
                videoPlayerContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            } else {
                console.error('ID del video di YouTube non trovato nell\'URL');
                videoPlayerContainer.innerHTML = errorMessage;
            }
        } else {
            videoPlayerContainer.innerHTML = '<video id="video-player" controls autoplay></video>';
            const newVideoElement = document.getElementById('video-player');

            if (Hls.isSupported()) {
                if (hls) {
                    hls.destroy();
                }
                hls = new Hls();
                
                hls.on(Hls.Events.ERROR, (event, data) => {
                    if (data.fatal) {
                        console.error('Errore fatale di Hls.js:', data);
                        videoPlayerContainer.innerHTML = errorMessage;
                    }
                });

                hls.loadSource(url);
                hls.attachMedia(newVideoElement);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    newVideoElement.play();
                });
            } else if (newVideoElement.canPlayType('application/vnd.apple.mpegurl')) {
                newVideoElement.src = url;
                newVideoElement.addEventListener('loadedmetadata', () => {
                    newVideoElement.play();
                });
                newVideoElement.addEventListener('error', () => {
                    videoPlayerContainer.innerHTML = errorMessage;
                });
            } else {
                videoPlayerContainer.innerHTML = errorMessage;
            }
        }
    }

    async function init() {
        try {
            const response = await fetch(m3u8Url);
            if (!response.ok) {
                throw new Error(`Errore di rete: ${response.status}`);
            }
            const data = await response.text();
            const lines = data.split('\n').filter(line => line.trim() !== '');

            allChannels = filterAndSortChannels(lines);
            const groupNames = Object.keys(allChannels).sort();
            
            generateNavMenu(groupNames);
            
            displayChannels(allChannels['Italy'], 'Italy');
            
        } catch (error) {
            console.error('Si è verificato un errore:', error);
            channelListContainer.innerHTML = '<p style="text-align: center; color: red;">Impossibile caricare i canali.</p>';
        }
    }
    
    channelDropdown.addEventListener('change', (event) => {
        const selectedUrl = event.target.value;
        const selectedName = event.target.options[event.target.selectedIndex].dataset.name;
        
        document.querySelectorAll('.channel-item').forEach(item => {
            item.classList.remove('selected-channel');
            if (item.dataset.url === selectedUrl) {
                item.classList.add('selected-channel');
            }
        });

        playChannel(selectedUrl);
    });

    hamburgerMenu.addEventListener('click', () => {
        navLinksMenu.classList.toggle('active');
    });

    navLinksMenu.addEventListener('click', (event) => {
        const target = event.target;
        const link = target.closest('a');
        const dropdownToggle = target.closest('.dropdown-toggle');

        if (dropdownToggle) {
            event.preventDefault();
            const dropdown = dropdownToggle.closest('.dropdown');
            dropdown.classList.toggle('active');
            return;
        }
        
        if (!link) return;

        if (link.dataset.action === 'open-disclaimer-modal') {
            event.preventDefault();
            disclaimerModal.style.display = 'block';
        } else if (link.dataset.action === 'open-api-modal') {
            event.preventDefault();
            apiModal.style.display = 'block';
        } else if (link.dataset.action === 'toggle-lights') {
            event.preventDefault();
            body.classList.contains('lights-off') ? turnLightsOn() : turnLightsOff();
        } 
        else if (link.dataset.group) {
            event.preventDefault();
            
            displayChannels(allChannels[link.dataset.group], link.dataset.group);
            
            const dropdown = link.closest('.dropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }

            if (navLinksMenu.classList.contains('active')) {
                navLinksMenu.classList.remove('active');
            }
        }
    });
    
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.dataset.modalId;
            document.getElementById(modalId).style.display = 'none';
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == disclaimerModal) {
            disclaimerModal.style.display = 'none';
        }
        if (event.target == apiModal) {
            apiModal.style.display = 'none';
        }
    });

    footerDisclaimerLink.addEventListener('click', (event) => {
        event.preventDefault();
        disclaimerModal.style.display = 'block';
    });

    const cookieBanner = document.getElementById('cookie-consent-banner');
    const acceptBtn = document.getElementById('accept-cookies-btn');

    function checkCookieConsent() {
        if (!localStorage.getItem('cookiesAccepted')) {
            cookieBanner.style.display = 'flex';
        }
    }

    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieBanner.style.display = 'none';
    });

    checkCookieConsent();

    init();
});