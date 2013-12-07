!function(a, b) {
    function c() {
        var a = this;
        this.promise = i.factory(), this.onDone = [], this.onAlways = [], this.onFail = [], 
        this.promise.then(function(b) {
            f(function() {
                g(a.onDone, function(a) {
                    a(b);
                }), g(a.onAlways, function(a) {
                    a(b);
                }), a.onAlways = [], a.onDone = [], a.onFail = [];
            });
        }, function(b) {
            f(function() {
                g(a.onFail, function(a) {
                    a(b);
                }), g(a.onAlways, function(a) {
                    a(b);
                }), a.onAlways = [], a.onDone = [], a.onFail = [];
            });
        });
    }
    function d() {
        this.deferred = !1, this.handlers = [], this.state = i.state.PENDING, this.value = null;
    }
    b.semetric = a;
    var e = function() {
        return new c();
    };
    e.when = function() {
        var a, b = 0, c = e(), d = [].slice.call(arguments);
        return d[0] instanceof Array && (d = d[0]), a = d.length, 0 === a ? c.resolve(null) : g(d, function(e) {
            e.then(function() {
                ++b !== a || c.isResolved() || (d.length > 1 ? c.resolve(d.map(function(a) {
                    return a.value || a.promise.value;
                })) : c.resolve(d[0].value || d[0].promise.value));
            }, function() {
                c.isResolved() || (d.length > 1 ? c.reject(d.map(function(a) {
                    return a.value || a.promise.value;
                })) : c.reject(d[0].value || d[0].promise.value));
            });
        }), c;
    }, c.prototype.constructor = c, c.prototype.always = function(a) {
        if ("function" != typeof a) throw new Error(h.invalidArguments);
        if (this.promise.resolved()) throw new Error(h.promiseResolved.replace("{{outcome}}", this.promise.outcome));
        return this.onAlways.push(a), this;
    }, c.prototype.done = function(a) {
        if ("function" != typeof a) throw new Error(h.invalidArguments);
        if (this.promise.resolved()) throw new Error(h.promiseResolved.replace("{{outcome}}", this.promise.outcome));
        return this.onDone.push(a), this;
    }, c.prototype.fail = function(a) {
        if ("function" != typeof a) throw new Error(h.invalidArguments);
        if (this.promise.resolved()) throw new Error(h.promiseResolved.replace("{{outcome}}", this.promise.outcome));
        return this.onFail.push(a), this;
    }, c.prototype.isRejected = function() {
        return this.promise.state === i.state.FAILURE;
    }, c.prototype.isResolved = function() {
        return this.promise.state === i.state.SUCCESS;
    }, c.prototype.reject = function(a) {
        return this.promise.reject.call(this.promise, a), this;
    }, c.prototype.resolve = function(a) {
        return this.promise.resolve.call(this.promise, a), this;
    }, c.prototype.state = function() {
        return this.promise.state;
    }, c.prototype.then = function(a, b) {
        return this.promise.then(a, b);
    };
    var f = function() {
        return "undefined" != typeof setImmediate ? setImmediate : "undefined" != typeof process ? process.nextTick : function(a) {
            setTimeout(a, 0);
        };
    }(), g = function(a, b) {
        var c, d = a.length;
        for (c = 0; d > c && b.call(a, a[c], c) !== !1; c++) ;
        return a;
    }, h = {
        invalidArguments: "Invalid arguments",
        promiseResolved: "The promise has been resolved: {{outcome}}"
    }, i = {
        delay: function() {
            return "undefined" != typeof setImmediate ? setImmediate : "undefined" != typeof process ? process.nextTick : function(a) {
                setTimeout(a, 0);
            };
        }(),
        factory: function() {
            return new d();
        },
        pipe: function(a, b) {
            a.then(function(a) {
                b.resolve(a);
            }, function(a) {
                b.reject(a);
            });
        },
        state: {
            PENDING: 0,
            FAILURE: 1,
            SUCCESS: 2
        }
    };
    d.prototype.constructor = d, d.prototype.process = function() {
        var a, b, c;
        return this.deferred = !1, this.state !== i.state.PENDING ? (c = this.value, b = this.state === i.state.SUCCESS, 
        g(this.handlers.slice(), function(d) {
            var e = d[b ? "success" : "failure"], f = d.promise;
            if (!e || "function" != typeof e) return c && "function" == typeof c.then ? i.pipe(c, f) : b ? f.resolve(c) : f.reject(c), 
            void 0;
            try {
                a = e(c);
            } catch (g) {
                return f.reject(g), void 0;
            }
            a && "function" == typeof a.then ? i.pipe(a, i) : f.resolve(a);
        }), this) : void 0;
    }, d.prototype.reject = function(a) {
        var b = this;
        if (!(this.state > i.state.PENDING)) return this.value = a, this.state = i.state.FAILURE, 
        this.deferred || (i.delay(function() {
            b.process();
        }), this.deferred = !0), this;
    }, d.prototype.resolve = function(a) {
        var b = this;
        if (!(this.state > i.state.PENDING)) return this.value = a, this.state = i.state.SUCCESS, 
        this.deferred || (i.delay(function() {
            b.process();
        }), this.deferred = !0), this;
    }, d.prototype.then = function(a, b) {
        var c = this, e = new d();
        return this.handlers.push({
            success: a,
            failure: b,
            promise: e
        }), this.state > i.state.PENDING && !this.deferred && (i.delay(function() {
            c.process();
        }), this.deferred = !0), e;
    };
    var j = "undefined" != typeof module && module.exports, k = j ? require("xmlhttprequest").XMLHttpRequest : window.XMLHttpRequest;
    semetric.deferred = e, semetric.core = {
        entities: {},
        timeseries: {},
        collection: {}
    };
    var l = semetric.core.xhr = {};
    l.isCors = !0, l.formatParams = function(a) {
        var b = "";
        for (var c in a) b += c + "=" + encodeURIComponent(a[c]) + "&";
        return b.substring(0, b.length - 1);
    }, l.execute = function(a) {
        var b = semetric.deferred(), c = new k();
        return c.timeout = 0, c.withCredentials = l.isCors, c.onreadystatechange = function() {
            4 === c.readyState && (200 === c.status ? c.responseText && b.resolve(JSON.parse(c.responseText)) : b.reject());
        }, c.open(a.method, a.url, !0), c.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), 
        a.data ? c.send(l.formatParams(a.data)) : c.send(), console.log("SENDING ", l.formatParams(a.data)), 
        b.promise;
    }, l.get = function(a, b) {
        return l.execute({
            url: a,
            method: "GET",
            data: b
        });
    }, l.post = function(a, b) {
        return l.execute({
            url: a,
            method: "POST",
            data: b
        });
    }, l.put = function(a, b) {
        return l.execute({
            url: a,
            method: "PUT",
            data: b
        });
    }, l.destroy = function(a, b) {
        return l.execute({
            url: a,
            method: "DELETE",
            data: b
        });
    }, semetric.errors = {
        NO_SEARCH_PARAMS: "NO_SEARCH_PARAMS",
        SERVER_ERROR: "SERVER_ERROR",
        PROPERTY_MISSING: "PROPERTY_MISSING",
        PROPERTY_LENGHT_SHORT: "PROPERTY_LENGHT_SHORT",
        PROPERTY_VALIDATION: "PROPERTY_VALIDATION"
    }, semetric.options = {
        API_URL: "/api/"
    }, semetric.utils = {
        fromunixtime: function(a) {
            return new Date(1e3 * (parseInt(a) || 0));
        },
        simpleCopy: function(a, b) {
            for (var c in b) a[c] = b[c];
            return a;
        },
        makeUrl: function(a, b) {
            try {
                var c = "?";
                for (var d in b) c += d + "=" + b[d] + "&";
                return a + c.slice(0, c.length - 1);
            } catch (e) {
                return a;
            }
        },
        math: {
            percentageChange: function(a) {
                var b = a.previous || 0, c = a.current || 0;
                return ((c - b) / b * 100).toFixed(1);
            },
            lerp: function(a) {
                var b = -1, c = a.concat(), d = function(a, b, c, d, e) {
                    return b + (d - b) * ((e - a) / (c - a));
                };
                return c.forEach(function(a, e) {
                    if (null !== a && void 0 !== a) b = e; else {
                        for (var f = e, g = e + 1, h = null; null == h; ) null !== c[g] && (h = g), g += 1;
                        c[f] = d(b, c[b], h, c[h], f);
                    }
                }), c;
            }
        }
    }, semetric.factory = function(a, b) {
        return semetric.http = a, b ? new m(semetric.http) : new m(semetric.http);
    };
    var m = function(a) {
        this.http = a;
    };
    semetric.extend = function(a) {
        var b = this, c = function() {
            b.apply(this, arguments), a && a.apply(this, arguments);
        }, d = function() {
            this.constructor = c;
        };
        return d.prototype = b.prototype, c.prototype = new d(), c.__super__ = b.prototype, 
        c.extend = semetric.extend, c;
    };
    var n = semetric.core.entities.Entity = function(a) {
        this.attrs = a || {}, this.entitiesCache = {}, this.requirements = {};
    };
    n.prototype.collection = function(a, b, c) {
        if (this.entitiesCache[a] && c) return this.entitiesCache[a];
        var d = semetric.deferred(), e = this, f = new o({
            factory: b
        });
        return f.url = this.url + "/" + a + "/", f.populate().then(function() {
            e.entitiesCache[a] = d.promise, d.resolve(f);
        }, function() {
            d.reject();
        }), d.promise;
    }, n.prototype.relatedEntities = function(a, b) {
        var c = this.url + "/" + a + "/";
        return new semetric.core.collection.Collection({
            factory: b
        }).populate(c);
    }, n.prototype.fetch = function(a) {
        if (!this.entityClass && !this.url) throw new Error("A class/url is need to fetch the entity");
        var b = this.url || semetric.utils.makeUrl(semetric.options.API_URL + this.entityClass + "/" + this.attrs.id, a), c = this, d = semetric.deferred();
        return semetric.http.get(b).then(function(a) {
            c.attrs = a.response, c.url = b, d.resolve(c);
        }, function() {
            d.reject();
        }), d.promise;
    }, n.stringPropertyValidator = function(a) {
        var b = {
            property: a,
            success: !1
        };
        return a ? a.length < 2 ? b.message = semetric.errors.PROPERTY_LENGHT_SHORT : b.success = !0 : b.message = semetric.errors.PROPERTY_MISSING, 
        b;
    }, n.prototype.validator = function() {
        var a = [];
        for (var b in this.requirements) {
            var c = this.requirements[b].call(this, this.attrs[b]);
            c.success || a.push(c);
        }
        return a;
    }, n.prototype.validate = function() {
        if (this.validations = this.validator(), this.validations.length > 0) {
            var a = Error(semetric.errors.PROPERTY_VALIDATION);
            throw a.validations = this.validations, a;
        }
    }, n.prototype.save = function(a) {
        var b = this;
        if (a = a || {
            simulate: !1
        }, !this.url) throw new Error("No endpoint specified");
        if (this.validate(), a.simulate) return this.attrs.cid = Math.random(), semetric.deferred().resolve(this);
        var c = semetric.deferred();
        return semetric.http.post(this.url, this.attrs).then(function(a) {
            if (a.success === !0) {
                for (var d in a) b.attrs[d] = a[d];
                c.resolve(b);
            } else console.log("FAILED --------> ", a), c.reject(a.error);
        }), c;
    }, n.prototype.update = function() {
        if (!this.url) throw new Error("No endpoint specified");
        return this.validate(), semetric.http.update(this.url, this.attrs);
    }, n.prototype.destroy = function() {
        if (!this.url) throw new Error("No endpoint specified");
        return semetric.http.destroy(url, this.attrs);
    };
    var o = semetric.core.collection.Collection = function(a) {
        a = a || {}, a.models = a.models || [], this.models = a.models, this.factory = a.factory, 
        a.factory && (this.models = this.models.map(function(b) {
            return new a.factory(b);
        }));
    };
    o.prototype.count = function() {
        return this.models.length;
    }, o.prototype.select = function(a) {
        return a = a || 0, this.models[a];
    }, o.prototype.add = function(a) {
        this.factory ? this.models.push(new this.factory(a)) : this.models.push(a);
    }, o.prototype.remove = function(a) {
        var b = this.models.indexOf(a);
        return b >= 0 ? this.models.splice(b, 1)[0] : null;
    }, o.prototype.isEmpty = function() {
        return 0 == this.models.length;
    }, o.prototype.populate = function(a, b) {
        var c = semetric.deferred(), d = this;
        return d.url = semetric.utils.makeUrl(a || this.url, b), semetric.http.get(d.url).then(function(a) {
            a.success === !0 ? (d.models = d.parse(a), c.resolve(d)) : c.reject(new Error(semetric.errors.SERVER_ERROR));
        }, function(a) {
            c.reject(new Error(semetric.errors.SERVER_ERROR, a));
        }), c.promise;
    }, o.prototype.parse = function(a) {
        var b = this, c = a.response.entities, d = a.response.entities[0].class;
        return b.factory && (c = c.map(function(a) {
            var c = new b.factory(a);
            return c.url = semetric.options.API_URL + d + "/" + c.attrs.id, c;
        })), c;
    }, semetric.core.collection.Collection.extend = semetric.core.entities.Entity.extend = semetric.extend;
    var p = n.extend(function() {});
    p.prototype.isRising = function() {
        return this.attrs.previous_rank - this.attrs.rank < 0;
    }, p.prototype.percentageChange = function() {
        return semetric.utils.math.percentageChange({
            previous: this.attrs.previous_rank,
            current: this.attrs.rank
        });
    };
    var q = semetric.core.entities.SemetricArtist = p.extend(function() {
        this.entityClass = "artist", this.url = this.attrs.id ? semetric.options.API_URL + "artist/" + this.attrs.id : semetric.options.API_URL + "artist";
    }), r = semetric.core.entities.SemetricUser = n.extend(function() {
        this.url = this.attrs.id ? semetric.options.API_URL + "user/" + this.attrs.id : semetric.options.API_URL + "user/", 
        this.requirements = {
            firstname: semetric.core.entities.Entity.stringPropertyValidator,
            surname: semetric.core.entities.Entity.stringPropertyValidator,
            country: semetric.core.entities.Entity.stringPropertyValidator,
            email: semetric.core.entities.Entity.stringPropertyValidator,
            phone: semetric.core.entities.Entity.stringPropertyValidator,
            company: semetric.core.entities.Entity.stringPropertyValidator,
            password: semetric.core.entities.Entity.stringPropertyValidator
        };
    }), s = o.extend(function() {});
    s.prototype.topChanges = function() {
        return [];
    }, s.prototype.topOverall = function() {
        return [];
    };
    var t = semetric.core.timeseries.Timeseries = function(a) {
        this.attrs = a || {}, this.attrs.url ? this.url = this.attrs.url : t.initialize.call(this);
    };
    t.prototype.isEmpty = function() {
        return this.attrs.data.length < 3;
    }, t.prototype.update = function(a) {
        if (!this.url) throw new Error("No URL Supplied");
        this.params = a || this.params || {};
        var b = semetric.deferred(), c = this, d = semetric.utils.makeUrl(this.url, this.params);
        return semetric.http.get(d).then(function(a) {
            c.attrs = a.response, t.initialize.call(c, a.response), b.resolve(c);
        }, function() {
            b.reject(new Error(semetric.errors.SERVER_ERROR));
        }), b.promise;
    }, t.prototype.diff = function(a) {
        var b = new t(this.url), a = semetric.utils.simpleCopy({}, this.params);
        return a.variant = "diff", b.update(a);
    }, t.prototype.cumlative = function(a) {
        var b = new t(this.url), a = semetric.utils.simpleCopy({}, this.params);
        return a.variant = "cumulative", b.update(a);
    }, t.prototype.range = function(a) {
        if (!a || !a.start || !a.end) throw new Error("Invalid time range, range parameter should have a start and end time in milliseconds");
        var b = this, c = {
            values: [],
            total: 0
        };
        return this.attrs.data.each(function(d, e) {
            var f = 1e3 * (b.attrs.start_time + e * b.attrs.period);
            f >= a.start && f <= a.end && (c.values.push({
                x: f,
                y: d
            }), c.total += d || 0);
        }), c;
    }, t.initialize = function() {
        this.start = semetric.utils.fromunixtime(this.attrs.start_time), this.end = semetric.utils.fromunixtime(this.attrs.end_time), 
        this.processing = this.attrs.processing, this.variant = this.attrs.variant, this.preprocess();
    }, t.prototype.preprocess = function() {
        var a = this;
        this.sumTotal = 0, this.graphData = [], this.change = 0, this.attrs.data = this.attrs.data || [], 
        this.attrs.data.forEach(function(b, c) {
            a.sumTotal += b || 0, a.graphData.push({
                x: 1e3 * (a.attrs.start_time + c * a.attrs.period),
                y: b
            });
        }), this.attrs.start_offset ? (this.attrs.data = semetric.utils.math.lerp(this.attrs.data), 
        this.sumTotal += this.attrs.start_offset || 0) : this.sumTotal = this.attrs.data[this.attrs.data.length - 1];
    }, t.extend = semetric.extend;
    var u = function(a) {
        this.attrs = a, this.artist = new q(a.artists[0]), this.series = new t({
            url: this.artist.url + this.attrs.path
        }), this.day = new t(a.summary.day), this.week = new t(a.summary.week), this.start = semetric.utils.fromunixtime(a.summary.start_time);
    };
    u.prototype.toString = function() {
        return this.attrs.name;
    };
    var v = function(a) {
        this.attrs = a;
    };
    v.prototype.get = function() {};
    var w = function(a) {
        this.http = a, this.cache = {};
    };
    w.expire = 18e6, w.cacheCall = function(a) {
        var b, c = this;
        return b = this.http.get(a), b.then(function(d) {
            d.success === !0 && (b.timestamp = new Date().getTime(), c.cache[a] = b);
        }), b;
    }, w.prototype.get = function(a) {
        var b, c = new Date().getTime();
        if (this.cache[a]) {
            var d = this.cache[a];
            b = c - d.timestamp < w.expire ? this.cache[a] : w.cacheCall.call(this, a);
        } else b = w.cacheCall.call(this, a);
        return b;
    }, w.prototype.post = function() {
        return this.http.post.apply(null, arguments);
    }, w.prototype.put = function() {
        return this.http.put.apply(null, arguments);
    }, w.prototype.delete = function() {
        this.http.destroy.apply(null, arguments);
    };
    var x = [ {
        id: "6aacf495049d4de99c809b0ad8120c39",
        label: "Fans Total",
        entityType: "artist"
    }, {
        id: "bb789492225c4c4da2e15f617acc9982",
        label: "Fans Added Daily",
        entityType: "artist"
    }, {
        id: "a5e7dbdfcd984dc28c350c26a2e703c0",
        label: "Fans Added Weekly",
        entityType: "artist"
    }, {
        id: "c6db7136d639444d9ab54a3c66e0b813",
        label: "Fans Daily High Flyers",
        entityType: "artist"
    }, {
        id: "7a614a370a2848b29c156e27dde582c8",
        label: "Plays Total",
        entityType: "artist"
    }, {
        id: "d527eeba4bdc42178b49d977b375936f",
        label: "Plays Daily",
        entityType: "artist"
    }, {
        id: "627b42c981d4413b83191efd8183a982",
        label: "Plays Weekly",
        entityType: "artist"
    }, {
        id: "b857276b34cf488f9a934765c3281af7",
        label: "Plays Daily High Flyers",
        entityType: "artist"
    }, {
        id: "23a368babfe44c77ad86c62a22377b3d",
        label: "BitTorrent Activity Total",
        entityType: "artist"
    }, {
        id: "8f533fd3ae614614a71f7fb406e598cc",
        label: "BitTorrent Activity Daily",
        entityType: "artist"
    }, {
        id: "2960402fc260409c8bcd75b00d8dc4c8",
        label: "BitTorrent Activity Daily High Flyers",
        entityType: "artist"
    }, {
        id: "7d02ea24ad4945f7bef16d483ae8799e",
        label: "BitTorrent Activity Total",
        entityType: "releasegroup"
    }, {
        id: "0695f0bba6144dfaa390e9b9f017ceab",
        label: "BitTorrent Activity Daily",
        entityType: "releasegroup"
    }, {
        id: "f4c9ea0888be458a9c2e52b3e754c2bf",
        label: "BitTorrent Activity Daily High Flyers",
        entityType: "releasegroup"
    }, {
        id: "3040cc0f02ed4dd1a2da9ea95c9a8272",
        label: "Views Activity Total",
        entityType: "artist"
    }, {
        id: "1574c43703344292a753fecf0f793c2e",
        label: "Views Activity Daily",
        entityType: "artist"
    }, {
        id: "b0de4888427d46ac8f599f2f6d51e293",
        label: "Views Activity Weekly",
        entityType: "artist"
    }, {
        id: "33e77c5fcb06412193995c9a4bb054f4",
        label: "Views Activity High Flyers",
        entityType: "artist"
    }, {
        id: "7908e358427f4efe9f5aac6df69bfcbd",
        label: "Comments Activity Total",
        entityType: "artist"
    }, {
        id: "d21e3cd170924bcd8874ec15d84b64f1",
        label: "Comments Activity Daily",
        entityType: "artist"
    }, {
        id: "75f972a32f3547e197668d545f4cda1d",
        label: "Comments Activity Weekly",
        entityType: "artist"
    }, {
        id: "e235b5206bac4eb78c80e90b7531db27",
        label: "Comments Activity High Flyers",
        entityType: "artist"
    }, {
        id: "7a614a370a2848b29c156e27dde582c8",
        label: "Plays Total",
        entityType: "artist"
    }, {
        id: "d527eeba4bdc42178b49d977b375936f",
        label: "Plays Daily",
        entityType: "artist"
    }, {
        id: "627b42c981d4413b83191efd8183a982",
        label: "Plays Weekly",
        entityType: "artist"
    }, {
        id: "b857276b34cf488f9a934765c3281af7",
        label: "Plays High Flyers",
        entityType: "artist"
    } ], y = function(a) {
        this.attrs = a, this.id = a.artist.id;
    };
    y.prototype.artist = function() {
        var a = new q();
        return a.url = semetric.options.API_URL + "artist/" + this.id, a.fetch();
    };
    var z = o.extend(function(a) {
        this.label = a.label, this.id = a.id, this.url = semetric.options.API_URL + "chart/" + a.id, 
        this.factory = y;
    });
    z.prototype.parse = function(a) {
        return a.response.entities = a.response.data, o.prototype.parse.call(this, a);
    }, m.prototype.charts = function() {
        return {
            allCharts: function() {
                return x.map(function(a) {
                    return o({
                        url: semetric.options.API_URL + "/charts/" + a.id,
                        label: a.label
                    });
                });
            },
            artistCharts: function() {
                var a = function(a) {
                    return "artist" === a.entityType;
                };
                return x.filter(a).map(function(a) {
                    return new z(a);
                });
            }
        };
    };
    var A = o.extend(function() {});
    A.prototype.parse = function(a) {
        var b = this, c = a.response.data;
        return b.factory && (c = c.map(function(a) {
            var c = new b.factory(a);
            return c;
        })), c;
    };
    var B = t.extend(function() {
        this.countriesCollection = new A({
            factory: v
        }), this.citiesCollection = new A({
            factory: v
        });
    });
    B.prototype.countries = function() {
        return this.countriesCollection.populate(this.url + "/location/country");
    }, B.prototype.cities = function() {
        return this.citiesCollection.populate(this.url + "/location/city");
    }, n.prototype.downloads = function() {
        var a = this;
        return {
            torrent: function() {
                var b = new B({
                    url: a.url + "/downloads/bittorrent"
                });
                return b;
            }
        };
    };
    var C = function(a, b) {
        this.http = a, this.entityType = b, this.baseURL = semetric.options.API_URL + b;
    };
    C.prototype.find = function(a) {
        var b = new c();
        return a ? new o({
            factory: q
        }).populate(this.baseURL, {
            q: a
        }) : (b.reject(new Error(semetric.errors.NO_SEARCH_PARAMS)), b.promise);
    }, C.prototype.select = function(a) {
        var b = new c();
        if (a) {
            var d = new q({
                id: a
            });
            return d.fetch();
        }
        return b.reject(new Error(semetric.errors.NO_SEARCH_PARAMS)), b.promise;
    }, m.prototype.entities = function(a) {
        return new C(this.http, a);
    };
    var D = semetric.EntityEvent = n.extend(function() {});
    D.prototype.period = function() {
        throw new Error("Not Yet Implemented");
    }, D.prototype.add = function() {
        throw new Error("Not Yet Implemented");
    }, D.prototype.events = function() {}, n.prototype.events = function() {
        var a = s({
            factory: D
        });
        return a.populate(this.url + "/events/");
    };
    var E = function(a) {
        this.url = a, this.summaries = {};
    };
    E.prototype.get = function() {
        var a = new c(), b = this;
        return semetric.http.get(b.url).then(function(c) {
            c.success ? (b.summaries = {}, c.response.entities.forEach(function(a) {
                var c = a.path.split("/")[1];
                b.summaries[c] = b.summaries[c] || new s({}), b.summaries[c].add(new u(a));
            }), a.resolve(b)) : a.reject(new Error(semetric.errors.SERVER_ERROR));
        }, function(b) {
            a.reject(b);
        }), a.promise;
    }, n.prototype.overview = function() {
        return new E(this.url + "/").get();
    };
    var F = function() {
        this.kpis = {};
    };
    F.prototype.totals = function() {
        var a = [];
        for (var b in this.kpis) try {
            this.kpis[b].metricTotal && a.push(this.kpis[b].metricTotal);
        } catch (c) {
            console.log(c);
        }
        return a;
    };
    var G = function(a) {
        this.attrs = a, this.attrs.endTime = semetric.utils.fromunixtime(a.end_time), this.timeseries = new t({
            url: a.metricUrl
        });
    };
    G.prototype.change = function() {
        return (this.attrs.current || 0) - (this.attrs.previous || 0);
    }, G.prototype.toString = function() {
        return this.attrs.metric + " - " + this.attrs.channel;
    }, G.prototype.percentageChange = function() {
        return semetric.math.percentageChange(this.attrs);
    }, G.prototype.summarize = function() {
        return this.attrs.previous + " - " + this.attrs.current + " - " + semetric.math.percentageChange(this.attrs);
    };
    var H = function(a) {
        this.metric = a.metric, this.channels = {};
        for (ch in a.channels) {
            var b = a.channels[ch];
            b.metric = this.metric, b.channel = ch, b.metricUrl = a.artistURL + "/" + this.metric + "/" + ch, 
            this.channels[ch] = new G(b), -1 != ch.indexOf("total") && (this.metricTotal = this.channels[ch]);
        }
    };
    H.prototype.fetchTimeseries = function() {
        var a = $.Deferred();
        return a.promise;
    }, H.prototype.getAllTimeseries = function() {
        var a = [];
        for (channel in this.channels) a.push(this.channels[channel].timeseries);
        return a;
    }, H.prototype.fetchTimeseriesFor = function(a) {
        return this.channels[a] ? this.channels[a].timeseries.fetch() : null;
    }, n.prototype.social = function() {
        var a = new c(), b = semetric.options.API_URL + "artist/" + this.attrs.id + "/kpi", d = semetric.options.API_URL + "artist/" + this.attrs.id;
        return semetric.http.get(b).then(function(b) {
            if (b.response) {
                var c = new F();
                for (metric in b.response) c.kpis[metric] = new H({
                    metric: metric,
                    channels: b.response[metric],
                    artistURL: d
                });
                a.resolve(c);
            } else a.reject(new Error(semetric.errors.SERVER_ERROR));
        }, function(b) {
            a.reject(b);
        }), a.promise;
    };
    var I = n.extend(function() {
        if (this.attrs.summary) {
            this.summary = {};
            for (var a in this.attrs.summary) this.summary[a] = void 0 !== this.attrs.summary[a].data ? new t(this.attrs.summary[a]) : semetric.utils.fromunixtime(this.attrs.summary[a]);
        }
        this.timeseries = new t({
            url: semetric.options.API_URL + this.attrs.class + "/" + this.attrs.source.code + "/" + this.attrs.id
        });
    }), J = function(a) {
        var b = new c(), d = semetric.options.API_URL + "artist/" + this.attrs.id + (a || "/video") + "/";
        return semetric.http.get(d).then(function(a) {
            if (a.success) {
                var c = new s({
                    factory: I,
                    models: a.response.entities
                });
                b.resolve(c);
            } else b.reject(new Error(semetric.errors.SERVER_ERROR));
        }, function() {
            b.reject(new Error(semetric.errors.SERVER_ERROR));
        }), b.promise;
    };
    q.prototype.tracks = J, function() {
        var a = semetric.core.entities.SemetricOrder = n.extend(function() {});
        r.prototype.orders = function() {
            return this.collection("order", a);
        }, r.prototype.communications = function() {
            return this.collection("comms", a);
        }, r.prototype.artists = function() {
            return this.url = semetric.options.API_URL + "user/" + this.attrs.id, this.collection("artist", q);
        };
        var b = o.extend(function() {
            this.url = semetric.options.API_URL + "user/", this.factory = r;
        });
        m.prototype.user = function() {
            return {
                list: function(a) {
                    return new b().populate(null, a);
                },
                find: function() {},
                get: function(a) {
                    var b = new r({
                        id: a
                    });
                    return b.entityClass = "user", b.fetch();
                }
            };
        };
    }();
}({}, function() {
    return this;
}());