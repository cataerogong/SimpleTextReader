// A raw WebDAV interface
var WebDAV = {
    async GET(url, force = false) {
        return await this.request('GET', url, (force ? { "If-Modified-Since": "0" } : {}), null, 'text');
    },

    async PROPFIND(url) {
        return await this.request('PROPFIND', url, { Depth: "1" }, null, 'xml');
    },

    async MKCOL(url) {
        return await this.request('MKCOL', url, {}, null, 'text');
    },

    async DELETE(url) {
        return await this.request('DELETE', url, {}, null, 'text');
    },

    async PUT(url, data) {
        return await this.request('PUT', url, {}, data, 'text');
    },

    async request(verb, url, headers, data, type) {
        headers["Content-Type"] = "text/xml; charset=UTF-8";
        let resp = await fetch(url, {
            credentials: "include",
            method: verb,
            headers: headers,
            body: data
        });
        if (!resp.ok) throw new Error(`Network response was not ok. ${resp.status} ${resp.statusText}`);
        let body = await resp.text();
        if (type == "xml") {
            let p = new DOMParser();
            let xml = p.parseFromString(body, "text/xml");
            if (xml) {
                body = xml.firstChild.nextSibling || xml.firstChild;
            }
        }
        return body;
    }
};

// An Object-oriented API around WebDAV.
WebDAV.Fs = function (rootUrl) {
    this.rootUrl = rootUrl;
    var fs = this;

    this.file = function (href) {
        this.type = 'file';

        this.url = fs.urlFor(href);

        this.name = fs.nameFor(this.url);

        this.read = async function (force = false) {
            return await WebDAV.GET(this.url, force);
        };

        this.write = async function (data) {
            return await WebDAV.PUT(this.url, data);
        };

        this.rm = async function () {
            return await WebDAV.DELETE(this.url);
        };

        return this;
    };

    this.dir = function (href) {
        this.type = 'dir';

        this.url = fs.urlFor(href);

        this.name = fs.nameFor(this.url);

        this.children = async function () {
            let doc = await WebDAV.PROPFIND(this.url);
            if (doc.childNodes == null) {
                throw new Error('No such directory: ' + this.url);
            }
            var result = [];
            // Start at 1, because the 0th is the same as self.
            for (var i = 1; i < doc.childNodes.length; i++) {
                var response = doc.childNodes[i];
                var href = response.getElementsByTagName('D:href')[0].firstChild.nodeValue;
                href = href.replace(/\/$/, ''); // Strip trailing slash
                var propstat = response.getElementsByTagName('D:propstat')[0];
                var prop = propstat.getElementsByTagName('D:prop')[0];
                var resourcetype = prop.getElementsByTagName('D:resourcetype')[0];
                var collection = resourcetype.getElementsByTagName('D:collection')[0];

                if (collection) {
                    result[i - 1] = new fs.dir(href);
                } else {
                    result[i - 1] = new fs.file(href);
                }
            }
            return result;
        };

        this.rm = async function () {
            return await WebDAV.DELETE(this.url);
        };

        this.mkdir = async function () {
            return await WebDAV.MKCOL(this.url);
        };

        return this;
    };

    this.urlFor = function (href) {
        return (/^http/.test(href) ? href : this.rootUrl + href);
    };

    this.nameFor = function (url) {
        return url.replace(/.*\/(.*)/, '$1');
    };

    return this;
};
