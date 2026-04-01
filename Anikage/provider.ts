/// <reference path="./online-streaming-provider.d.ts" />

function Provider() {}

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
    return [];
};

Provider.prototype.findEpisodes = function(id) {
    var episodes = [];
    for (var i = 1; i <= 12; i++) {
        episodes.push({
            number: i,
            id: id + "-" + i,
            url: "https://anikage.cc/anime/watch/" + id + "?host=pahe&ep=" + i + "&type=sub",
            title: "Episode " + i
        });
    }
    return episodes;
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
