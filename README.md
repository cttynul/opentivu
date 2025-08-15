# opentivu

A web hub for streaming free-to-air TV channels, featuring a custom M3U playlist API. Totally powered by community-maintened [IPTV repository](https://github.com/Free-TV/IPTV)

This project is a simple web application for watching publicly available IPTV channels. It provides a clean, responsive interface to browse and stream channels from a central, curated list. The player includes an "Immersive Mode" for a focused viewing experience and an API for developers to generate their own filtered `.m3u` playlists.

## Why Another One? 
The web is full of great IPTV projects, and honestly, many are fantastic. Projects like the excellent https://github.com/iptv-org are the gold standard. So why reinvent the wheel?

Well, sometimes you just want the wheel to have a slightly different color.

This project was born out of a mix of personal preferences and a desire for a more tailored experience. I found myself thinking:

- *"I don't like the order of these links."*
- *"The visual presentation of this other one isn't quite my style."*
- *"That other project had some dead channels that kept bugging me."*
- *"I just wanna open a link and watch italian TV"*

Instead of complaining, I decided to build something that was just right for me.

## Features

- **Responsive Design**: Enjoy channels on any device, from desktop to mobile.
- **Immersive Mode**: A dark theme that optimizes the viewing experience by reducing on-screen distractions.
- **Country-specific filtering**: Easily find and browse channels from supported countries.
- **M3U Playlist API**: A powerful API to generate custom `.m3u` playlists for your favorite regions.

## How to Use

Simply navigate to the website to start watching. You can use the navigation menu to filter channels by country and toggle Immersive Mode.

### API Usage

You can also use the built-in API to get a filtered `.m3u` playlist for your preferred country. The API endpoint is:

`https://opentivu.local/api/[country_code]`

**Available Country Codes:**

- `it` (Italy)
- `de` (Germany)
- `fr` (France)
- `es` (Spain)
- `us` (USA)

**Example:**

To get the Italian TV channels, you would use:
`https://opentivu.local/api/it`

## Project Structure

- `index.html`: The main HTML file for the application.
- `style.css`: All the CSS styles, including light and dark themes.
- `app.js`: The core JavaScript logic for channel fetching, player control, and UI interaction.
- `netlify.toml`: Configuration file for Netlify redirects and serverless functions.
- `functions/m3u-generator.js`: The serverless function that powers the M3U playlist API.

## Development

This project was built using vanilla HTML, CSS, and JavaScript. HLS.js is used for streaming video content.

## Future Developments: EPG Integration

A key next step for this project is the integration of an **EPG** (Electronic Program Guide). An EPG provides a schedule of current and upcoming programs for each channel, enhancing the user experience significantly. This feature would be integrated in two main ways:

1. Web Frontend
By integrating an EPG into the web application, users would be able to:
* See what's on now: A dedicated section or overlay on the video player would display the title of the current program.
* View the schedule: Users could browse the full program schedule for each channel, allowing them to plan their viewing.
* Easier discovery: An interactive EPG grid would make it easier to discover new content and see what's coming up next on different channels.
* This would transform the current channel list into a more dynamic and informative viewing portal.

2. M3U Playlist API
* For developers and advanced users, EPG integration would also be added to the M3U playlist API. This would involve embedding EPG metadata directly into the generated playlists.
* EPG data for tvg-id and tvg-name: The API will add tvg-id and tvg-name tags to each channel entry, which are essential for external players to automatically fetch and display EPG data from a separate source.
* Full EPG URL: The API could also provide the URL for the XMLTV file, which is the standard format for EPG data. This would allow users to easily import the full program guide into their player of choice.

This enhancement would make the generated playlists much more powerful and compatible with a wider range of IPTV software and services.

## Disclaimer

All channels shown here are free, legal and easily accessible on the web. They are retrieved from the following repository: [https://github.com/Free-TV/IPTV](https://github.com/Free-TV/IPTV).

This repository does not host any video files. It simply contains a list of links to video streams that are already publicly available on the web. These links are sourced from a community-driven repository and are believed to point to content made public by the copyright holders.

If you are a copyright holder and believe a link infringes on your rights, please follow these steps:

1. To request the removal of a link, you can submit a pull request or open an issue.
2. Please note that removing a link from our list will not remove the content from the web. To have the content taken down, you must contact the web host that is actually hosting the video file.

**Important**: Linking to content does not constitute direct copyright infringement, and therefore, a DMCA notice to GitHub is not the correct procedure for content hosted elsewhere.

## License

```
            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
                    Version 2, December 2004

 Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>

 Everyone is permitted to copy and distribute verbatim or modified
 copies of this license document, and changing it is allowed as long
 as the name is changed.

            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

  0. You just DO WHAT THE FUCK YOU WANT TO.
```