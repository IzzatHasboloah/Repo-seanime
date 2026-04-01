/// <reference path="./online-streaming-provider.d.ts" />

function Provider() {}

Provider.prototype.getSettings = function() {
    return {
        name: "Anikage",
        description: "Anikage.cc",
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
    if (!opts || !opts.query) return [];

    var url = "https://anikage.cc/browse?search=" + encodeURIComponent(opts.query);

    return fetch(url).then(function(r) {
        return r.text();
    }).then(function(html) {
        var $ = LoadDoc(html);
        var results = [];

        $("a[href*='/anime/info/']").each(function(_, el) {
            var href = $(el).attr("href") || "";
            var title = $(el).text().trim() || $(el).attr("title") || "";

            if (href && title) {
                var id = href.split("/anime/info/")[1];
                if (id) id = id.split("?")[0];

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

Provider.prototype.findEpisodes = function(id) {
    var url = "https://anikage.cc/anime/info/" + id;

    return fetch(url).then(function(r) {
        return r.text();
    }).then(function(html) {
        var $ = LoadDoc(html);
        var episodes = [];

        for (var i = 1; i <= 24; i++) {
            episodes.push({
                number: i,
                id: id + "-" + i,
                url: "https://anikage.cc/anime/watch/" + id + "?host=pahe&ep=" + i + "&type=sub",
                title: "Episode " + i
            });
        }
        return episodes;
    });
};

Provider.prototype.findEpisodeServer = function(episode, serverId) {
    if (!serverId) serverId = "pahe";

    return {
        url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8",
        headers: {
            "Referer": "https://kwik.si"
        },
        qualities: [
            { quality: "auto", url: "https://sv6.otakuu.se/storage/06/11/f311a0cf99f579cff72cb12920c12a35fadc43852e782efa87e5e17c7cc340e1/uwu.m3u8" }
        ],
        subtitles: []
    };
};

var provider = new Provider();
export default provider;
