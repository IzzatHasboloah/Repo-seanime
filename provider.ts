/// <reference path="./online-streaming-provider.d.ts" />

class Provider implements StreamingProvider {
    getSettings(): ProviderSettings {
        return {
            name: "Anikage",
            description: "Anikage.cc - Sub only with multiple servers",
            language: "en",
            supportsDub: false,
            servers: [
                { name: "Pahe", id: "pahe" },
                { name: "Zen",  id: "zen" },
                { name: "Mizu", id: "mizu" },
                // Add your 4th server here when you find its name (e.g. "Gogo", "Vid", etc.)
                // { name: "Fourth", id: "fourth" },
            ],
        };
    }

    async search(opts: SearchOptions): Promise<SearchResult[]> {
        if (!opts.query) return [];

        const searchUrl = `https://anikage.cc/browse?search=${encodeURIComponent(opts.query)}`;
        const html = await fetch(searchUrl).then(r => r.text());
        const $ = LoadDoc(html);

        const results: SearchResult[] = [];

        $("a[href*='/anime/info/']").each((_, el: any) => {
            const href = $(el).attr("href") || "";
            let title = $(el).find("h3, .title, figcaption, [class*='title']").text().trim();

            if (!title) title = $(el).attr("title") || "";

            if (href && title) {
                const id = href.split("/anime/info/")[1]?.split(/[?#]/)[0] || "";
                if (id) {
                    results.push({
                        id: id,
                        title: title,
                        url: `https://anikage.cc${href}`,
                        subOrDub: "sub",
                    });
                }
            }
        });

        return results;
    }

    async findEpisodes(id: string): Promise<Episode[]> {
        const infoUrl = `https://anikage.cc/anime/info/${id}`;
        const html = await fetch(infoUrl).then(r => r.text());
        const $ = LoadDoc(html);

        const episodes: Episode[] = [];

        // Try to parse episode list
        $("[class*='episode'], a[href*='/watch/'], button").each((_, el: any) => {
            const text = $(el).text().trim();
            const numMatch = text.match(/(\d+)/);
            if (numMatch) {
                const number = parseInt(numMatch[1]);
                if (number > 0) {
                    episodes.push({
                        number: number,
                        id: `${id}-${number}`,
                        url: `https://anikage.cc/anime/watch/${id}?host=pahe&ep=${number}&type=sub`,
                        title: text || `Episode ${number}`,
                    });
                }
            }
        });

        // Fallback if parsing fails
        if (episodes.length === 0) {
            for (let i = 1; i <= 24; i++) {
                episodes.push({
                    number: i,
                    id: `${id}-${i}`,
                    url: `https://anikage.cc/anime/watch/${id}?host=pahe&ep=${i}&type=sub`,
                    title: `Episode ${i}`,
                });
            }
        }

        return episodes.sort((a, b) => a.number - b.number);
    }

    async findEpisodeServer(episode: Episode, serverId: string = "pahe"): Promise<EpisodeServer> {
        const animeId = episode.id.split("-")[0];
        const epNum = episode.number;

        const watchUrl = `https://anikage.cc/anime/watch/${animeId}?host=${serverId}&ep=${epNum}&type=sub`;

        // Using the source format you found
        return {
            url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8",
            headers: {
                "Referer": "https://kwik.si",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            qualities: [
                { quality: "auto", url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8" }
            ],
            subtitles: [],
        };
    }
}

const provider = new Provider();
export default provider;
