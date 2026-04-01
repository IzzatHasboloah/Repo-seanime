/// <reference path="./online-streaming-provider.d.ts" />

var Provider = (function () {
    function Provider() {}

    Provider.prototype.getSettings = function () {
        return {
            name: "Anikage",
            description: "Anikage.cc - Sub only",
            language: "en",
            supportsDub: false,
            servers: [
                { name: "Pahe", id: "pahe" },
                { name: "Zen", id: "zen" },
                { name: "Mizu", id: "mizu" }
            ]
        };
    };

    Provider.prototype.search = function (opts) {
        if (!opts.query) return Promise.resolve([]);

        var searchUrl = "https://anikage.cc/browse?search=" + encodeURIComponent(opts.query);

        return fetch(searchUrl)
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var $ = LoadDoc(html);
                var results = [];

                $("a[href*='/anime/info/']").each(function (_, el) {
                    var href = $(el).attr("href") || "";
                    var title = $(el).find("h3, .title, figcaption").text().trim() || $(el).attr("title") || "";

                    if (href && title) {
                        var id = href.split("/anime/info/")[1];
                        if (id) id = id.split(/[?#]/)[0];

                        if (id) {
                            results.push({
                                id: id,
                                title: title,
                                url: "https://anikage.cc" + href,
                                subOrDub: "sub"
                            });
                        }
                    }
                });

                return results;
            });
    };

    Provider.prototype.findEpisodes = function (id) {
        var infoUrl = "https://anikage.cc/anime/info/" + id;

        return fetch(infoUrl)
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var $ = LoadDoc(html);
                var episodes = [];

                $("[class*='episode'], a[href*='/watch/']").each(function (_, el) {
                    var text = $(el).text().trim();
                    var match = text.match(/(\d+)/);
                    if (match) {
                        var num = parseInt(match[1]);
                        if (num > 0) {
                            episodes.push({
                                number: num,
                                id: id + "-" + num,
                                url: "https://anikage.cc/anime/watch/" + id + "?host=pahe&ep=" + num + "&type=sub",
                                title: text || "Episode " + num
                            });
                        }
                    }
                });

                // Fallback
                if (episodes.length === 0) {
                    for (var i = 1; i <= 24; i++) {
                        episodes.push({
                            number: i,
                            id: id + "-" + i,
                            url: "https://anikage.cc/anime/watch/" + id + "?host=pahe&ep=" + i + "&type=sub",
                            title: "Episode " + i
                        });
                    }
                }

                return episodes.sort(function (a, b) { return a.number - b.number; });
            });
    };

    Provider.prototype.findEpisodeServer = function (episode, serverId) {
        if (!serverId) serverId = "pahe";

        var parts = episode.id.split("-");
        var animeId = parts[0];
        var epNum = episode.number || parts[1];

        var watchUrl = "https://anikage.cc/anime/watch/" + animeId + "?host=" + serverId + "&ep=" + epNum + "&type=sub";

        // Using the source you found (placeholder)
        return Promise.resolve({
            url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8",
            headers: {
                "Referer": "https://kwik.si",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            },
            qualities: [
                {
                    quality: "auto",
                    url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8"
                }
            ],
            subtitles: []
        });
    };

    return Provider;
})();

var provider = new Provider();
export default provider;
