/*
 *               [plugSlack]
 *   Cause only plug wasn't good enough
 *
 * Coded by Matheus Avellar ("Beta Tester")
 *
 * Most of the stuff here is probably not
 * the most efficient. But it works. So who cares.
 *
 */

"use strict";

const version = "v0.0.36";
const PS_PATH = "https://rawgit.com/MatheusAvellar/plugSlack/master/resources/";
var ps, slackObj, slackWS, tkn, cn;
var _all = {
    users: {},
    channels: {}
};

$.ajax({
type: "GET",
url: PS_PATH + "styles.css",
success: function(_ajxData) {
    $("head").append(
        "<link "
        +    " rel='stylesheet' "
        +    " type='text/css' "
        +    " href='" + PS_PATH + "styles.css'"
        + ">"
    );

ps = {
    you: {},
    init: function() {
        API.chatLog(version);
        $("div#header-panel-bar").append(
            "<div id='ps-button' class='header-panel-button notify'>"
            +    "<i class='icon icon-star-white'></i>"
            +    "<span class='request-count'>0</span>"
            +"</div>"
        );

        $(".app-right").append(
            "<div id='ps-chat'>"
            +    "<div id='ps-header'>"
            +        "<div id='ps-channels-button' class='ps-btn'>channels</div>"
            +        "<div id='ps-users-button' class='ps-btn selected'>users</div>"
            +        "<div id='ps-groups-button' class='ps-btn'>groups</div>"
            +    "</div>"
            +    "<div class='channels-list ps-list'></div>"
            +    "<div class='users-list ps-list'></div>"
            +    "<div class='groups-list ps-list'></div>"
            +    "<div id='ps-actual-chat'></div>"
            +    "<div class='ps-start' onclick='return ps.start();'>"
            +         "<input id='ps-token' placeholder='Insert your token here!'>"
            +         "Start plugSlack"
            +    "</div>"
            +    "<input id='ps-submit' />"
            +"</div>"
        );

        $("div.ps-btn").on("click", function() {
            $("div.ps-btn").removeClass("selected");
            $("div.ps-list").hide();
            $(this).addClass("selected");
            const _sel = $(this).attr("id") == "ps-channels-button" ? "div.channels-list" :
                       $(this).attr("id") == "ps-users-button" ? "div.users-list" : "div.groups-list";
            $(_sel).show();
        });

        $("div#chat-button, div#users-button, div#waitlist-button, div#friends-button").on("click", function() {
            $("div#ps-button").removeClass("selected");
            $("#ps-chat").hide();
        });

        $("div#ps-button").on("click", function() {
            $(".header-panel-button").removeClass("selected");
            $("#chat, #user-lists, #waitlist, div.app-right div.friends").hide();
            $("#ps-chat").show();
            $("div#ps-button").addClass("selected");
        });
    },
    start: function() {
        tkn = $("input#ps-token").val().trim();
        if (tkn) {
            $.ajax({
                type: "GET",
                url: "https://slack.com/api/rtm.start?token=" + tkn,
                success: function(data) {
                    $("div.ps-start").remove();
                    slackObj = data;
                    for (var i = 0, l = slackObj.users.length; i < l; i++) {
                        if (!slackObj.users[i].deleted) {
                            for (var j = 0, k = slackObj.ims.length; j < k; j++) {
                                if (slackObj.users[i].id == slackObj.ims[j].user) {
                                    ps.utils.appendItem(
                                        {
                                            name: slackObj.users[i].name,
                                            id: slackObj.users[i].id,
                                            ims: slackObj.ims[j].id,
                                            tag: "user",
                                            status: slackObj.users[i].presence
                                        }
                                    );
                                    _all.users[slackObj.users[i].id] = {
                                        name: slackObj.users[i].name,
                                        prof: slackObj.users[i].profile
                                    }
                                    _all.channels[slackObj.ims[j].id] = slackObj.users[i].name;
                                    break;
                                } else if (slackObj.users[i].name == slackObj.self.name) {
                                    ps.utils.appendItem(
                                        {
                                            name: slackObj.users[i].name,
                                            id: slackObj.users[i].id,
                                            tag: "user",
                                            status: slackObj.users[i].presence
                                        }
                                    );
                                    _all.users[slackObj.users[i].id] = {
                                        name: slackObj.users[i].name,
                                        prof: slackObj.users[i].profile
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    $("div.users-list div.user[ps-uid^='USLACKBOT']").addClass("selected");
                    ps.utils.loadHistory(slackObj.ims[0].id);
                    for (var i = 0, l = slackObj.bots.length; i < l; i++) {
                        if (!slackObj.bots[i].deleted) {
                            _all.users[slackObj.bots[i].id] = {
                                name: slackObj.bots[i].name,
                                prof: slackObj.bots[i].icons
                            }
                        }
                    }
                    for (var i = 0, l = slackObj.channels.length; i < l; i++) {
                        if (!slackObj.channels[i].is_archived && slackObj.channels[i].is_member) {
                            ps.utils.appendItem(
                                {
                                    name: slackObj.channels[i].name,
                                    id: slackObj.channels[i].id,
                                    tag: "channel"
                                }
                            );
                            _all.channels[slackObj.channels[i].id] = slackObj.channels[i].name;
                        }
                    }
                    for (var i = 0, l = slackObj.groups.length; i < l; i++) {
                        if (!slackObj.groups[i].is_archived) {
                            ps.utils.appendItem(
                                {
                                    name: slackObj.groups[i].name,
                                    id: slackObj.groups[i].id,
                                    tag: "group"
                                }
                            );
                            _all.channels[slackObj.groups[i].id] = slackObj.groups[i].name;
                        }
                    }

                    $("div#ps-chat div.channels-list div.channel, "
                    + "div#ps-chat div.users-list div.user, "
                    + "div#ps-chat div.groups-list div.group").on("click", function() {
                        if (!$(this).hasClass("selected")) {
                            $("div.channel.selected, "
                            + "div.user.selected, "
                            + "div.group.selected").removeClass("selected");
                            $("div.ps-message").remove();
                            $("div.ps-nothing-here").remove();
                            $(this).addClass("selected").removeClass("new");
                            cn = $(this).attr("ps-cid");
                            ps.utils.loadHistory(cn);
                        }
                    });

                    slackWS = new WebSocket(slackObj.url);

                    slackWS.onopen = function(_data){
                        console.log("Connected " + slackObj.self.name);
                    }

                    slackWS.onmessage = function(_data){
                        _data = JSON.parse(_data.data);
                        console.log("@ onmessage");
                        console.log(_data);
                        if (_data
                         && _data.type == "message") {
                            var current = {
                                user: "",
                                channel: ""
                            };
                            if (_data.user) {
                                console.log(_all.users[_data.user].name);
                                current.user = _all.users[_data.user].name;
                            }
                            if (_data.channel) {
                                console.log(" @ " + _all.channels[_data.channel]);
                                current.channel = _all.channels[_data.channel];
                            }
                            if (_data.channel == $("div.channel.selected").attr("ps-cid")) {
                                var _p = _all.users[_data.user].prof;
                                if (_p.image_32) {  _p = _p.image_32;  } else {  _p = _p.image_48;  }
                                ps.utils.appendMessage(
                                    {
                                        message: ps.utils.format(_data.text),
                                        name: current.user,
                                        id: _data.user,
                                        prof: _p,
                                        channel: current.channel,
                                        cid: _data.channel,
                                        time: ps.utils.fixTime(_data.ts)
                                    }
                                );
                            } else if (_data.channel) {
                                var _cid = _data.channel;
                                var _l = _cid.trim()[0] == "D" ? "user" : _cid.trim()[0] == "C" ? "channel" : "group";
                                $("div." + _l + "[ps-cid^='" + _cid + "']").addClass("new");
                            }
                        }
                    }

                    slackWS.onerror = function(_data) {
                        console.log("@ onerror");
                    }
                },
                error: function(data) {
                    console.log("Error authenticating");
                    console.log(data);
                }
            });
        } else {
            console.log("Token not inserted");
        }
    },
    utils: {
        appendItem: function(obj) {
            if (obj.tag == "channel") {
                $("div#ps-chat div.channels-list").append(
                    "<div class='channel' ps-cid='" + obj.id + "'>"
                    +    "<div class='channelName'>" + obj.name + "</div>"
                    +"</div>"
                );
            } else if (obj.tag == "user") {
                var _isSlackbot = obj.name == " selected" ? selected : "";
                $("div#ps-chat div.users-list").append( 
                    "<div class='user" + _isSlackbot + "' ps-uid='" + obj.id + "' ps-cid='" + obj.ims + "'>"
                    +    "<div class='presence " + obj.status + "'></div>"
                    +    "<div class='username'>" + obj.name + "</div>"
                    +"</div>"
                );
            } else {
                $("div#ps-chat div.groups-list").append(
                    "<div class='group' ps-cid='" + obj.id + "'>"
                    +    "<div class='groupName'>" + obj.name + "</div>"
                    +"</div>"
                );
            }
        },
        appendMessage: function(obj) {
            console.log("@ appendMessage");
            if (obj.message) {
                console.log("@ appendMessage.success");
                obj.name = !obj.name ? "" : obj.name;
                obj.message = obj.message
                            .split("<").join("&lt;")
                            .split(">").join("&gt;")
                            .split("!§").join("<")
                            .split("§!").join(">");
                var _c = $("div#ps-actual-chat")
                var _scroll = _c[0].scrollTop > _c[0].scrollHeight -_c.height() - 28;
                $("#ps-actual-chat").append(
                    "<div class='ps-message'>"
                    +    "<div class='ps-prof' style='background: url(" + obj.prof + ");'></div>"
                    +    "<div class='ps-meta'>"
                    +        "<div class='ps-from' ps-id='" + obj.id + "'>" + obj.name + "</div>"
                    +        "<div class='ps-time'>" + obj.time + "</div>"
                    +        "<div class='ps-channel' ps-cid='" + obj.cid + "'>" + obj.channel + "</div>"
                    +    "</div>"
                    +    "<div class='ps-text'>" + obj.message + "</div>"
                    +"</div>"
                );
                if (_scroll) {
                    $("div#ps-actual-chat")[0].scrollTop = _c[0].scrollHeight;
                }
            }
        },
        loadHistory: function(cid) {
            if (cid && cid.toString()) {
                var _l = cid.trim()[0] == "D" ? "im" : cid.trim()[0] == "C" ? "channels" : "groups";
                $.ajax({
                    type: "GET",
                    url: "https://slack.com/api/" + _l + ".history?token=" + tkn + "&channel=" + cid,
                    success: function(data) {
                        if (data.ok) {
                            console.log("@ loadHistory.success");
                            if (data.messages.length > 0) {
                                for (var i = data.messages.length - 1, l = -1; i > l; i--) {
                                    var _u = data.messages[i].user;
                                    if (_all.users[_u]) {
                                        console.log("Double loadHistory success");
                                        var _p = _all.users[_u].prof.image_32 ? "image_32" : "image_48";
                                        ps.utils.appendMessage(
                                            {
                                                id: _u,
                                                name: _all.users[_u].name,
                                                prof: _all.users[_u].prof[_p],
                                                cid: cid,
                                                channel: _all.channels[cid],
                                                message: ps.utils.format(data.messages[i].text),
                                                time: ps.utils.fixTime(data.messages[i].ts)
                                            }
                                        );
                                    } else {
                                        console.log("-=[Error @ 315]=- [" + _u + "]");
                                        console.log(data.messages[i]);
                                    }
                                }
                            } else {
                                $("div#ps-actual-chat").append("<div class='ps-nothing-here'></div>");
                            }
                        }
                    },
                    error: function(data) {
                        console.log("@ loadHistory.error");
                    }
                });
            }
        },
        format: function(message) {
            var _final = message;
            var _formats = [
                {c: "*", r: "b"},
                {c: "_", r: "em"},
                {c: "```", r: "pre class='ps-pre-big'"},
                {c: "`", r: "pre class='ps-pre-small'"}
            ];
            for (var _i = 0; _i < _final.length; _i++) {
                for (var i = 0, l = _formats.length; i < l; i++) {
                    if (_final.indexOf(_formats[i].c) != -1) {
                        var _message = _final.replace(_formats[i].c, "!§" + _formats[i].r + "§!");
                        if (_message.indexOf(_formats[i].c) != -1) {
                            _message = _message.replace(_formats[i].c, "!§/" + _formats[i].r + "§!");
                            _final = _message;
                        }
                    }
                }/*
                if (_final.indexOf("<http") != -1) {
                    var _in = _final.indexOf("<http");
                    _message = _final.replace("<http", "!§a href='http");
                    if (_message.indexOf(">") > _final.indexOf("<http")) {
                        var _a = _final.substr(_in + 1, _final.indexOf(">") - 1);
                        _message = _message.replace(">", "' target='_blank' class='ps-link'§!" + _a + "!§/a§!");
                        _final = _message;
                    }
                }*/
            }
            return _final;
        },
        fixTime: function(secs) {
            var t = (new Date(1970, 0, 1));
            t.setSeconds(secs);
            /*var m = t.getMinutes() + t.getTimezoneOffset();
            var h = t.getHours();
            while (m >= 60) {
                m = m - 60;
                h++;
            }
            if (h > 23) {  h = h - 24;   }
            if (h < 10) {  h = "0" + h;  }
            if (m < 10) {  m = "0" + m;  }
            return h + ":" + m;*/
            return t.getHours() + ":" + t.getMinutes();
        }
    }
};

ps.init();

},
error: function(msg) {
    API.chatLog("Error loading CSS! Try again later!");
}
});