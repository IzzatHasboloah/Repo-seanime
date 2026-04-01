/// <reference path="./online-streaming-provider.d.ts" />

var Provider = function() {};

Provider.prototype.getSettings = function() {
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

Provider.prototype.search = function(opts) {
    if (!opts.query) {
        return Promise.resolve([]);
    }

    var url = "https://anikage.cc/browse?search=" + encodeURIComponent(opts.query);

    return fetch(url)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var $ = LoadDoc(html);
            var results = [];

            $("a[href*='/anime/info/']").each(function(i, el) {
                var href = $(el).attr("href") || "";
                var title = $(el).find("h3").text().trim();
                if (!title) title = $(el).find(".title").text().trim();
                if (!title) title = $(el).attr("title") || "";

                if (href && title) {
                    var id = href.split("/anime/info/")[1];
                    if (id) {
                        id = id.split("?")[0].split("#")[0];
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

Provider.prototype.findEpisodes = function(id) {
    var url = "https://anikage.cc/anime/info/" + id;

    return fetch(url)
        .then(function(r) { return r.text(); })
        .then(function(html) {
            var $ = LoadDoc(html);
            var episodes = [];

            $("[class*='episode'], a[href*='watch'], button").each(function(i, el) {
                var text = $(el).text().trim();
                var match = text.match(/\d+/);
                if (match) {
                    var num = parseInt(match[0]);
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

            return episodes.sort(function(a, b) { return a.number - b.number; });
        });
};

Provider.prototype.findEpisodeServer = function(episode, serverId) {
    if (!serverId) serverId = "pahe";

    var parts = episode.id.split("-");
    var animeId = parts[0];
    var epNum = episode.number ? episode.number : (parts[1] ? parts[1] : 1);

    return Promise.resolve({
        url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8",
        headers: {
            "Referer": "https://kwik.si",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        qualities: [
            { quality: "auto", url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8" }
        ],
        subtitles: []
    });
};

var provider = new Provider();
export default provider;
