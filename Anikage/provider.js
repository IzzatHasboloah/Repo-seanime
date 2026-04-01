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
        var url = this.api + "/?s=" + encodeURIComponent(query.query);
        var html = await this.GETText(url);

        var $ = LoadDoc(html);
        var results = [];

        $(".film_list-wrap .flw-item").each(function (_, el) {
            var title = el.find(".film-name a").text().trim();
            var link = el.find(".film-name a").attr("href") || "";
            var id = link.split("/").pop();

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
        var url = this.api + "/anime/info/" + id;
        var html = await this.GETText(url);

        var $ = LoadDoc(html);
        var episodes = [];

        $(".ss-list a").each(function (_, el) {
            var text = el.text().replace("EP ", "").trim();
            var epNum = parseInt(text);

            if (!isNaN(epNum)) {
                episodes.push({
                    id: id + "-" + epNum,
                    number: epNum,
                    title: "Episode " + epNum,
                    url: this.api + "/anime/watch/" + id + "?ep=" + epNum,
                });
            }
        }.bind(this));

        episodes.sort(function (a, b) {
            return a.number - b.number;
        });

        return episodes;
    }

    async findEpisodeServer(episode, server) {
        var epNum = episode.number;
        var animeId = episode.id.split("-")[0];

        var servers = ["pahe", "zen", "mizu"];
        var selectedServer = (server && server !== "default") ? server : "pahe";

        // manual loop (NO for-of)
        for (var i = 0; i < servers.length; i++) {

            var srv = servers[i];

            // try selected first
            if (i === 0) srv = selectedServer;

            try {
                var watchUrl = this.api + "/anime/watch/" + animeId +
                    "?host=" + srv +
                    "&ep=" + epNum +
                    "&type=sub";

                var html = await this.GETText(watchUrl);
                var $ = LoadDoc(html);

                var iframe = $("iframe").attr("src");
                if (!iframe) continue;

                var iframeHtml = await this.GETText(iframe);

                var match = iframeHtml.match(/https?:\/\/[^"]+\.m3u8/);

                // fallback decode
                if (!match) {
                    var scripts = iframeHtml.match(/eval\(f.+?\}\)\)/g);

                    if (scripts) {
                        for (var j = 0; j < scripts.length; j++) {
                            try {
                                var decoded = eval(scripts[j]);
                                var m3u8 = decoded.match(/https?:\/\/[^"]+\.m3u8/);
                                if (m3u8) {
                                    match = m3u8;
                                    break;
                                }
                            } catch (e) {}
                        }
                    }
                }

                if (!match) continue;

                return {
                    server: srv,
                    headers: {
                        Referer: iframe,
                        "User-Agent": "Mozilla/5.0",
                    },
                    videoSources: [
                        {
                            url: match[0],
                            type: "m3u8",
                            quality: "auto",
                            subtitles: [],
                        },
                    ],
                };

            } catch (e) {
                console.log("Server failed:", srv);
            }
        }

        throw new Error("All servers failed");
    }

    async _makeRequest(url) {
        var res = await fetch(url, {
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
        return await this._makeRequest(url).then(function (res) {
            return res.text();
        });
    }
}

export default new Provider();
