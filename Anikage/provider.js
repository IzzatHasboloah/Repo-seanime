function Provider() {
    this.api = "https://anikage.cc";
}

Provider.prototype.getSettings = function () {
    return {
        episodeServers: ["pahe"],
        supportsDub: false,
    };
};

Provider.prototype.search = function (opts) {
    var query = encodeURIComponent(opts.query);

    return fetch(this.api + "/?s=" + query)
        .then(function (res) { return res.text(); })
        .then(function (html) {

            var $ = LoadDoc(html);
            var results = [];

            $(".film_list-wrap .flw-item").each(function (_, el) {
                var title = $(el).find(".film-name a").text().trim();
                var url = $(el).find(".film-name a").attr("href");
                var id = url.split("/").pop();

                results.push({
                    id: id,
                    title: title,
                    subOrDub: "sub",
                    url: url,
                });
            });

            return results;
        });
};

Provider.prototype.findEpisodes = function (id) {
    var self = this;

    return fetch(this.api + "/anime/info/" + id)
        .then(function (res) { return res.text(); })
        .then(function (html) {

            var $ = LoadDoc(html);
            var episodes = [];

            $(".ss-list a").each(function (_, el) {
                var text = $(el).text().replace("EP ", "").trim();
                var epNum = parseInt(text);

                if (!isNaN(epNum)) {
                    episodes.push({
                        id: id + "-" + epNum,
                        number: epNum,
                        title: "Episode " + epNum,
                        url: self.api + "/anime/watch/" + id + "?ep=" + epNum + "&host=pahe&type=sub",
                    });
                }
            });

            episodes.sort(function (a, b) {
                return a.number - b.number;
            });

            return episodes;
        });
};

Provider.prototype.findEpisodeServer = function (episode, server) {
    var self = this;

    var epNum = episode.number;
    var animeId = episode.id.split("-")[0];

    var watchUrl = this.api + "/anime/watch/" + animeId +
        "?host=" + (server || "pahe") +
        "&ep=" + epNum +
        "&type=sub";

    return fetch(watchUrl)
        .then(function (res) { return res.text(); })
        .then(function (html) {

            var $ = LoadDoc(html);
            var iframe = $("iframe").attr("src");

            if (!iframe) {
                throw new Error("No iframe found");
            }

            return fetch(iframe, {
                headers: { Referer: self.api }
            })
                .then(function (res) { return res.text(); })
                .then(function (iframeHtml) {

                    var match = iframeHtml.match(/https?:\/\/[^"]+\.m3u8/);

                    if (!match) {
                        throw new Error("No m3u8 found");
                    }

                    return {
                        videoSources: [
                            {
                                url: match[0],
                                type: "m3u8",
                                quality: "auto",
                                subtitles: [],
                            }
                        ],
                        headers: {
                            Referer: iframe,
                        },
                        server: server || "pahe",
                    };
                });
        });
};

var provider = new Provider();
export default provider;
