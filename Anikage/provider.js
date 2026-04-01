class Provider {

    api = "https://anikage.cc";

    getSettings() {
        return {
            episodeServers: ["pahe"],
            supportsDub: false,
        };
    }

    async search(opts) {
        const query = encodeURIComponent(opts.query);
        const res = await fetch(`${this.api}/?s=${query}`);
        const html = await res.text();

        const $ = LoadDoc(html);
        const results = [];

        $(".film_list-wrap .flw-item").each((_, el) => {
            const title = $(el).find(".film-name a").text().trim();
            const url = $(el).find(".film-name a").attr("href");
            const id = url.split("/").pop();

            results.push({
                id: id,
                title: title,
                subOrDub: "sub",
                url: url,
            });
        });

        return results;
    }

    async findEpisodes(id) {
        const episodes = [];

        const res = await fetch(`${this.api}/anime/info/${id}`);
        const html = await res.text();

        const $ = LoadDoc(html);

        $(".ss-list a").each((_, el) => {
            const epNum = parseInt($(el).text().replace("EP ", "").trim());
            const epId = id + "-" + epNum;

            episodes.push({
                id: epId,
                number: epNum,
                title: "Episode " + epNum,
                url: `${this.api}/anime/watch/${id}?ep=${epNum}&host=pahe&type=sub`,
            });
        });

        episodes.sort((a, b) => a.number - b.number);

        return episodes;
    }

    async findEpisodeServer(episode, server) {
        const epNum = episode.number;
        const animeId = episode.id.split("-")[0];

        const watchUrl = `${this.api}/anime/watch/${animeId}?host=${server || "pahe"}&ep=${epNum}&type=sub`;

        const res = await fetch(watchUrl);
        const html = await res.text();

        const $ = LoadDoc(html);

        // Find iframe
        const iframe = $("iframe").attr("src");

        if (!iframe) {
            throw new Error("No iframe found");
        }

        // Fetch iframe page
        const iframeRes = await fetch(iframe, {
            headers: {
                Referer: this.api,
            },
        });

        const iframeHtml = await iframeRes.text();

        // Try extract m3u8
        const m3u8Match = iframeHtml.match(/https?:\/\/[^"]+\.m3u8/);

        if (!m3u8Match) {
            throw new Error("No m3u8 found");
        }

        const videoUrl = m3u8Match[0];

        return {
            videoSources: [
                {
                    url: videoUrl,
                    type: "m3u8",
                    quality: "auto",
                    subtitles: [],
                },
            ],
            headers: {
                Referer: iframe,
            },
            server: server || "pahe",
        };
    }
}

export default new Provider();
