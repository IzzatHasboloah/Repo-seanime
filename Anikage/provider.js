/// <reference path="./online-streaming-provider.d.ts" />
/// <reference path="./core.d.ts"/>

class Provider {

    constructor() {
        this.api = "https://anikage.cc";
    }

    getSettings() {
        return {
            episodeServers: ["pahe", "zen", "mizu"],
            supportsDub: false,
        };
    }

    async search(query) {
        const url = `${this.api}/?s=${encodeURIComponent(query.query)}`;
        const html = await this.GETText(url);

        const $ = LoadDoc(html);
        const results = [];

        $(".film_list-wrap .flw-item").each((_, el) => {
            const title = el.find(".film-name a").text().trim();
            const link = el.find(".film-name a").attr("href") || "";
            const id = link.split("/").pop();

            results.push({
                id: id,
                title: title,
                url: link,
                subOrDub: "sub",
            });
        });

        return results;
    }

    async findEpisodes(id) {
        const url = `${this.api}/anime/info/${id}`;
        const html = await this.GETText(url);

        const $ = LoadDoc(html);
        const episodes = [];

        $(".ss-list a").each((_, el) => {
            const text = el.text().replace("EP ", "").trim();
            const epNum = parseInt(text);

            if (!isNaN(epNum)) {
                episodes.push({
                    id: `${id}-${epNum}`,
                    number: epNum,
                    title: `Episode ${epNum}`,
                    url: `${this.api}/anime/watch/${id}?ep=${epNum}`,
                });
            }
        });

        episodes.sort((a, b) => a.number - b.number);

        return episodes;
    }

    async findEpisodeServer(episode, server) {
        const epNum = episode.number;
        const animeId = episode.id.split("-")[0];

        const servers = ["pahe", "zen", "mizu"];
        const selectedServer = server !== "default" ? server : "pahe";

        for (const srv of [selectedServer, ...servers]) {
            try {
                const watchUrl = `${this.api}/anime/watch/${animeId}?host=${srv}&ep=${epNum}&type=sub`;

                const html = await this.GETText(watchUrl);
                const $ = LoadDoc(html);

                const iframe = $("iframe").attr("src");

                if (!iframe) continue;

                const iframeHtml = await this.GETText(iframe);

                // Try direct m3u8
                let match = iframeHtml.match(/https?:\/\/[^"]+\.m3u8/);

                // Fallback: packed JS decode
                if (!match) {
                    const scripts = iframeHtml.match(/eval\(f.+?\}\)\)/g);

                    if (scripts) {
                        for (const script of scripts) {
                            try {
                                const decoded = eval(script);
                                const m3u8 = decoded.match(/https?:\/\/[^"]+\.m3u8/);
                                if (m3u8) {
                                    match = m3u8;
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }

                if (!match) continue;

                const videoUrl = match[0];

                return {
                    server: srv,
                    headers: {
                        Referer: iframe,
                        "User-Agent": "Mozilla/5.0",
                    },
                    videoSources: [
                        {
                            url: videoUrl,
                            type: "m3u8",
                            quality: "auto",
                            subtitles: [],
                        },
                    ],
                };

            } catch (e) {
                console.log("Server failed:", srv, e);
            }
        }

        throw new Error("All servers failed");
    }

    async _makeRequest(url) {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0",
                "Referer": this.api,
            },
        });

        if (!res.ok) {
            throw new Error("Request failed");
        }

        return res;
    }

    async GETText(url) {
        return await this._makeRequest(url).then(res => res.text());
    }
}

export default new Provider();
