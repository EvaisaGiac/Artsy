function getQueryVariable(t) {
    for (var e = window.location.search.substring(1), i = e.split("&"), s = 0; s < i.length; s++) {
        var n = i[s].split("=");
        if (decodeURIComponent(n[0]) === t) return decodeURIComponent(n[1])
    }
}

function hexToRgb(t) {
    var e = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(t);
    return e ? {
        r: parseInt(e[1], 16),
        g: parseInt(e[2], 16),
        b: parseInt(e[3], 16)
    } : null
}

function rgb2hex(t) {
    return t = t.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i), t && 4 === t.length ? "#" + ("0" + parseInt(t[1], 10).toString(16)).slice(-2) + ("0" + parseInt(t[2], 10).toString(16)).slice(-2) + ("0" + parseInt(t[3], 10).toString(16)).slice(-2) : ""
}
window.App = {
    elements: {
        board: $("#board"),
        palette: $(".palette"),
        boardMover: $(".board-mover"),
        boardZoomer: $(".board-zoomer"),
        boardContainer: $(".board-container"),
        cursor: $(".cursor"),
        timer: $(".cooldown-timer"),
        reticule: $(".reticule"),
        alert: $(".message"),
        coords: $(".coords"),
        pixelInfo: $(".pixel-info"),
        chatContainer: $(".chat-container"),
        usersContainer: $(".users-container"),
        loginContainer: $(".login-container"),
        chatToggle: $(".toggle-chat"),
		donateToggle: $(".toggle-donate"),
        usersToggle: $(".toggle-users"),
        loginToggle: $(".toggle-login"),
        loginButton: $(".login-button"),
        chatInput: $(".chat-input"),
        restrictedToggle: $(".restricted-toggle")
    },
    panX: 0,
    panY: 0,
    scale: 4,
    maxScale: 40,
    minScale: .75,
    cooldown: 0,
    color: null,
    init: function() {
		var enableDraw=false;
		var enableGesture=false;
        this.color = null, this.connectionLost = !1, this.showRestrictedAreas = !1, this.restrictedAreas = null, this.username = null, this.spectate_user = null, $(".board-container").hide(), $(".reticule").hide(), $(".ui").hide(), $(".message").hide(), $(".cursor").hide(), $(".cooldown-timer").hide(), this.elements.usersToggle.hide(), $.get("/boardinfo", this.initBoard.bind(this)), this.elements.pixelInfo.click(function() {
            this.elements.pixelInfo.addClass("hide")
        }.bind(this)), this.initBoardMovement(), this.initBoardPlacement(), this.initCursor(), this.initReticule(), this.initAlert(), this.initCoords(), this.initSidebar(), this.initMoveTicker(), this.initRestrictedAreas(), this.initContextMenu(), Notification.requestPermission()
    },
    initBoard: function(t) {
        this.width = t.width, this.height = t.height, this.palette = t.palette, this.custom_colors = t.custom_colors, this.initPalette(), this.elements.board.attr("width", this.width).attr("height", this.height), this.updateTransform();
        var e = getQueryVariable("x") || this.width / 2,
            i = getQueryVariable("y") || this.height / 2;
        (e < 0 || e >= this.width) && (e = this.width / 2), (i < 0 || i >= this.height) && (e = this.height / 2), this.centerOn(e, i), this.scale = getQueryVariable("scale") || this.scale, this.updateTransform(), this.initSocket(), this.drawBoard()
    },
    drawBoard: function() {
		
        this.image = new Image, this.image.onload = function() {
            this.connectionLost && this.alert(null), this.elements.board[0].getContext("2d").drawImage(this.image, 0, 0, this.width, this.height)
        }.bind(this), this.image.onerror = function() {
            this.alert("Refreshing board..."), setTimeout(this.drawBoard.bind(this), 1e3)
        }.bind(this), this.image.src = "/boarddata?d=" + Date.now();
    },
    initRestrictedAreas: function() {
        this.elements.restrictedToggle.click(this.restrictedAreaToggle.bind(this))
    },
    restrictedAreaToggle: function() {
        this.loadRestrictedAreas(), this.showRestrictedAreas = !this.showRestrictedAreas, this.showRestrictedAreas ? this.elements.restrictedToggle.text("Hide Restricted Areas") : this.elements.restrictedToggle.text("Show Restricted Areas")
    },
    loadRestrictedAreas: function() {
        null === this.restrictedAreas && $.get("/restricted", function(t) {
            this.restrictedAreas = [], t.forEach(function(t) {
                t.div = $("<div>", {
                    class: "selection"
                }), $(".ui").append(t.div), this.restrictedAreas.push(t)
            }.bind(this))
        }.bind(this)), this.elements.board.on("mousemove", function(t) {
            null !== this.restrictedAreas && this.restrictedAreas.forEach(function(t) {
                if (this.showRestrictedAreas) {
                    var e = (t.endX - (t.startX - 1)) * App.scale,
                        i = (t.endY - (t.startY - 1)) * App.scale,
                        s = App.boardToScreenSpace(t.startX, t.startY);
                    t.div.css("transform", "translate(" + s.x + "px, " + s.y + "px)"), t.div.css("width", e + "px").css("height", i + "px"), t.div.show()
                } else t.div.hide()
            }.bind(this))
        }.bind(this))
    },
    initPalette: function() {
        if (this.palette.forEach(function(t, e) {
                $("<div>").addClass("palette-color").css("background-color", t).click(function() {
                    0 === this.cooldown ? this.switchColor(t) : this.switchColor(null)
                }.bind(this)).appendTo(this.elements.palette)
            }.bind(this)), this.custom_colors) {
            $("<input>").addClass("color-picker").appendTo(this.elements.palette);
            $(".color-picker").spectrum({
                showPalette: !0,
                showInput: !0,
				allowEmpty:true,
                preferredFormat: "hex",
                localStorageKey: "kti.place",
                change: function(t) {
                    this.switchColor(null !== t ? t.toHexString() : null)
                }.bind(this),
                show: function() {
                    $(".color-picker").spectrum("reflow")
                }
            })
        }
    },
    initBoardMovement: function() {
		
		$('body').keydown(function(e){
		if(e.keyCode == 32){
			enableGesture = true;
		}
		});
		$('body').keyup(function(e){
		if(e.keyCode == 32){
			enableGesture = false;
		}
		if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
			enableGesture = true;
		}else {
			var enableGesture = false;	
		}
        var t = function(t) {
            this.panX += t.dx / this.scale, this.panY += t.dy / this.scale, this.updateTransform()
        }.bind(this);
		if (enableGesture==true){
        interact(this.elements.boardContainer[0]).draggable({
            inertia: !1,
            onmove: t
        }).gesturable({
            onmove: function(e) {
                this.scale *= 1 + e.ds, this.updateTransform(), t(e)
            }.bind(this)
        }).styleCursor(!1), $(document).on("keydown", function(t) {
            "BODY" === t.target.nodeName && (87 === t.keyCode || 38 === t.keyCode ? this.panY = t.shiftKey ? this.panY += 1 : this.panY += 100 / this.scale : 83 === t.keyCode || 40 === t.keyCode ? this.panY = t.shiftKey ? this.panY -= 1 : this.panY -= 100 / this.scale : 65 === t.keyCode || 37 === t.keyCode ? this.panX = t.shiftKey ? this.panX += 1 : this.panX += 100 / this.scale : 68 === t.keyCode || 39 === t.keyCode ? this.panX = t.shiftKey ? this.panX -= 1 : this.panX -= 100 / this.scale : 81 === t.keyCode || 34 === t.keyCode ? (this.scale /= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale))) : 69 === t.keyCode || 33 === t.keyCode ? (this.scale *= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale))) : 27 === t.keyCode && (this.switchColor(null), this.elements.pixelInfo.addClass("hide"), this.elements.reticule.hide(), this.elements.cursor.hide()), this.updateTransform())
        }.bind(this)), this.elements.boardContainer.on("wheel", function(t) {
            this.elements.pixelInfo.addClass("hide");
            var e = this.scale;
            t.originalEvent.deltaY > 0 ? this.scale /= 1.3 : this.scale *= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale));
            var i = t.clientX - this.elements.boardContainer.width() / 2,
                s = t.clientY - this.elements.boardContainer.height() / 2;
            this.panX -= i / e, this.panX += i / this.scale, this.panY -= s / e, this.panY += s / this.scale, this.updateTransform()
        }.bind(this))
		}else{
        $(document).on("keydown", function(t) {
            "BODY" === t.target.nodeName && (87 === t.keyCode || 38 === t.keyCode ? this.panY = t.shiftKey ? this.panY += 1 : this.panY += 100 / this.scale : 83 === t.keyCode || 40 === t.keyCode ? this.panY = t.shiftKey ? this.panY -= 1 : this.panY -= 100 / this.scale : 65 === t.keyCode || 37 === t.keyCode ? this.panX = t.shiftKey ? this.panX += 1 : this.panX += 100 / this.scale : 68 === t.keyCode || 39 === t.keyCode ? this.panX = t.shiftKey ? this.panX -= 1 : this.panX -= 100 / this.scale : 81 === t.keyCode || 34 === t.keyCode ? (this.scale /= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale))) : 69 === t.keyCode || 33 === t.keyCode ? (this.scale *= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale))) : 27 === t.keyCode && (this.switchColor(null), this.elements.pixelInfo.addClass("hide"), this.elements.reticule.hide(), this.elements.cursor.hide()), this.updateTransform())
        }.bind(this)), this.elements.boardContainer.on("wheel", function(t) {
            this.elements.pixelInfo.addClass("hide");
            var e = this.scale;
            t.originalEvent.deltaY > 0 ? this.scale /= 1.3 : this.scale *= 1.3, this.scale = Math.min(this.maxScale, Math.max(this.minScale, this.scale));
            var i = t.clientX - this.elements.boardContainer.width() / 2,
                s = t.clientY - this.elements.boardContainer.height() / 2;
            this.panX -= i / e, this.panX += i / this.scale, this.panY -= s / e, this.panY += s / this.scale, this.updateTransform()
        }.bind(this))			
		}

		});
    },
    initBoardPlacement: function() {
         var t, e, i = !1,
            s = function(s) {
                t = s.clientX, e = s.clientY, i = !1
            },
            n = function(s) {
                null !== this.spectate_user && (this.spectate_user = null, this.alert(null));
                var n = Math.abs(t - s.clientX),
                    o = Math.abs(e - s.clientY);
                if (!i)
                    if (i = !0, n < 5 && o < 5 && 1 === s.which) {
                        var a = this.screenToBoardSpace(s.clientX, s.clientY);
                        if (null !== this.color && this.cooldown <= 0) this.elements.pixelInfo.addClass("hide"), this.place(a.x, a.y);
                        else if (null === this.color) {
                            if (window.ModTools && window.ModTools.selectionModeEnabled) return;
                            this.centerOn(a.x, a.y);
                            var h = this.boardToScreenSpace(a.x, a.y),
                                r = .5 * this.scale;
                            /*this.elements.pixelInfo.css("transform", "translate(" + Math.floor(h.x + r) + "px, " + Math.floor(h.y + r) + "px)"), this.elements.pixelInfo.text("Loading"), this.elements.pixelInfo.removeClass("hide"), $.get("/pixel?x=" + a.x + "&y=" + a.y, function(t) {
                                if (null !== t) {
                                    var e = "rgb(" + t.colorR + "," + t.colorG + "," + t.colorB + ")",
                                        i = $("<span>").css("background-color", e);
                                    i.click(function() {
                                        this.switchColor(rgb2hex(e))
                                    }.bind(this));
                                    var s = moment(t.createdAt).format("DD/MM/YYYY hh:mm:ss a");
                                    this.elements.pixelInfo.text("Placed by " + t.username + " at " + s), i.prependTo(this.elements.pixelInfo)
                                } else this.elements.pixelInfo.text("Nothing has been placed here!")
                            }.bind(this))*/
                        }
                    } else this.elements.pixelInfo.addClass("hide")
            }.bind(this);
		//if (enableDraw==true){
		this.elements.board.on("pointerdown", s).on("mousedown", s).on("pointerup", n).on("mouseup", n).contextmenu(function(t) {
			t.preventDefault(), this.switchColor(null)
		}.bind(this))
		//}else{
			//this.alert("You must login to draw.");
		//}
    },
    initCursor: function() {
        var t = function(t) {
            this.elements.cursor.css("transform", "translate(" + t.clientX + "px, " + t.clientY + "px)")
        }.bind(this);
        this.elements.boardContainer.on("pointermove", t).on("mousemove", t)
    },
    initReticule: function() {
        var t = function(t) {
            var e = this.screenToBoardSpace(t.clientX, t.clientY);
            e.x |= 0, e.y |= 0;
            var i = this.boardToScreenSpace(e.x, e.y);
            this.elements.reticule.css("transform", "translate(" + i.x + "px, " + i.y + "px)"), this.elements.reticule.css("width", this.scale - 1 + "px").css("height", this.scale - 1 + "px"), null === this.color ? this.elements.reticule.hide() : this.elements.reticule.show()
        }.bind(this);
        this.elements.board.on("pointermove", t).on("mousemove", t)
    },
    initCoords: function() {
        this.elements.board.on("mousemove", function(t) {
            var e = this.screenToBoardSpace(t.clientX, t.clientY);
            this.elements.coords.text("(" + e.x + ", " + e.y + ")")
        }.bind(this))
    },
    initAlert: function() {
        this.elements.alert.find(".close").click(function() {
            this.elements.alert.fadeOut(200)
        }.bind(this))
    },
    initSocket: function() {
		this.alert("Canvas has been frozen");
        var t = 0;
        this.socket = io(), this.socket.on("connect", function() {
            $(".board-container").show(), $(".ui").show(), $(".loading").fadeOut(500), this.elements.alert.fadeOut(200), this.connectionLost && this.drawBoard()
        }.bind(this)), this.socket.on("disconnect", function() {
            this.connectionLost = !0, this.elements.loginButton.prop("disabled", !1), this.alert("Disconnected from server... Attempting to reconnect")
        }.bind(this));
        var e = $(".move-ticker-body");
        this.socket.on("session", function(t) {
            t.userdata ? this.onAuthentication(t.userdata) : null !== this.username && this.onAuthentication({
                success: !1
            }), t.cooldown ? this.updateTime(t.cooldown) : this.updateTime(0), this.updateUserCount(t.users.connected), this.updateUserList(t.users)
        }.bind(this)), this.socket.on("place", function(t) {
            var i = this.elements.board[0].getContext("2d");
            if (i.fillStyle = t.color, i.fillRect(t.x, t.y, 1, 1), e.is(":visible")) {
                var s = $("<div>", {
                    class: "chat-line"
                }).appendTo(e);
                $("<span>", {
                    class: "username"
                }).text(t.session_id).appendTo(s), $("<a>", {
                    href: "javascript:App.centerOn(" + t.x + "," + t.y + ")"
                }).text(": " + t.x + ", " + t.y).appendTo(s), e.scrollTop(e.prop("scrollHeight")), e.children().length >= 15 && e.children().first().remove()
            }
            null !== this.spectate_user && this.spectate_user === t.session_id && this.centerOn(t.x, t.y)
        }.bind(this)), this.socket.on("alert", function(t) {
            this.alert(t)
        }.bind(this)), this.socket.on("cooldown", function(t) {
            this.updateTime(t)
        }.bind(this)), this.socket.on("force-sync", function() {
            this.drawBoard()
        }.bind(this)), this.socket.on("auth", function(t) {
            t.message && this.alert(t.message), this.onAuthentication(t)
        }.bind(this)), this.socket.on("users", function(t) {
            this.updateUserCount(t.connected), this.updateUserList(t)
        }.bind(this)), this.socket.on("chat", function(e) {
            var i = $(".chat-log"),
                s = $("<div>", {
                    class: "chat-line"
                }).appendTo(i),
                n = $("<span>", {
                    class: "username"
                }).text(e.chat_id),
                o = $("<span>", {
                    class: "chat-message"
                }).text(e.message);
            this.elements.chatContainer.is(":hidden") && t <= 125 ? (t++, this.elements.chatToggle.text("Chat (" + t + ")")) : t = 0;
            var a, h, r, l = !1,
                c = [],
                h = /(@[a-z0-9]+)/gi;
            do {
                if (a = h.exec(o.html())) {
                    var d = a[0].replace("@", "").toLowerCase();
                    l || e.chat_id === this.username || d !== this.username && "everyone" !== d && "world" !== d || (l = !0, new Notification("Place Reloaded", {
                        body: "Message from " + e.chat_id + ": " + e.message
                    }));
                    var u = $("<span>", {
                        class: "username"
                    }).text(a[0]).prop("outerHTML");
                    c.push({
                        div: u,
                        index: a.index,
                        length: a[0].length
                    })
                }
            } while (a);
            for (r = c.length - 1; r >= 0; r--) o.html(o.html().substr(0, c[r].index) + c[r].div + o.html().substr(c[r].index + c[r].length, o.html().length));
            c = [], h = /([0-9]+)+\,(\ +)?([0-9]+)/g;
            do {
                if (a = h.exec(o.html())) {
                    var m = a[0].split(",");
                    if (m[0] < 0 || m[0] > this.width || m[1] < 0 || m[1] > this.height) continue;
                    var p = $("<a>", {
                        class: "",
                        href: "javascript:App.centerOn(" + m[0] + "," + m[1] + ")"
                    }).text(a[0]).prop("outerHTML");
                    c.push({
                        div: p,
                        index: a.index,
                        length: a[0].length
                    })
                }
            } while (a);
            for (r = c.length - 1; r >= 0; r--) o.html(o.html().substr(0, c[r].index) + c[r].div + o.html().substr(c[r].index + c[r].length, o.html().length));
            e.is_moderator && n.addClass("moderator"), $("<span>", {
                class: "timestamp"
            }).append($("<small>").text(moment().format("HH:mm"))).appendTo(s), n.appendTo(s), $("<span>", {
                class: "colon"
            }).text(":").appendTo(s), o.appendTo(s), i.scrollTop(i.prop("scrollHeight")), i.children().length >= 125 && i.find(".chat-line:first").remove()
        }.bind(this))
    },
    updateUserList: function(t) {
        var e = $(".moderators"),
            i = e.closest(".user-list-section");
        0 !== t.moderators.length ? (e.empty(), i.show(), t.moderators.forEach(function(t) {
            $("<div>", {
                class: "username moderator"
            }).text(t).appendTo(e)
        })) : i.hide(), e = $(".registered"), i = e.closest(".user-list-section"), 0 !== t.registered.length ? (e.empty(), i.show(), t.registered.forEach(function(t) {
            $("<div>", {
                class: "username"
            }).text(t).appendTo(e)
        })) : i.hide(), e = $(".anons"), i = e.closest(".user-list-section"), 0 !== t.anons.length ? (e.empty(), i.show(), t.anons.forEach(function(t) {
            $("<div>", {
                class: "username"
            }).text(t).appendTo(e)
        })) : i.hide()
    },
    initContextMenu: function() {
        ["right", "left"].forEach(function(t) {
            $.contextMenu({
                selector: ".username",
                trigger: t,
                zIndex: 1e3,
                autoHide: !0,
                items: {
                    spectate: {
                        name: "Spectate",
                        callback: function(t, e) {
                            App.spectate(e.$trigger.text())
                        }
                    },
                    mention: {
                        name: "Mention",
                        callback: function(t, e) {
                            App.mention(e.$trigger.text())
                        }
                    }
                }
            })
        })
    },
    updateUserCount: function(t) {
        this.elements.usersToggle.fadeIn(200), this.elements.usersToggle.text("Users: " + t)
    },
    authenticate: function() {
        this.socket.emit("auth", {
            username: $("#username").val(),
            password: $("#password").val()
        })
    },
    onAuthentication: function(t) {
        if (t.success) this.elements.loginToggle.text("Logout"), enableDraw=true, this.elements.loginContainer.hide(), this.elements.palette.removeClass("palette-sidebar"), this.username = t.username, t.is_moderator && !window.ModTools && $.get("js/mod_tools.js");
        else {
            if (null !== this.username) return location.reload();
            this.elements.loginToggle.text("Login"), this.elements.loginButton.prop("disabled", !1)
			enableDraw=false
        }
    },
    initSidebar: function() {
        this.elements.chatToggle.click(function() {
            this.elements.chatContainer.toggle(), this.elements.usersContainer.hide(), this.elements.loginContainer.hide(), this.elements.chatToggle.text("Chat"), this.elements.palette.toggleClass("palette-sidebar", this.elements.chatContainer.is(":visible"))
		}.bind(this)), this.elements.donateToggle.click(function() {
			window.open("http://paypal.me/ZuluArt/","_self")
        }.bind(this)), this.elements.usersToggle.click(function() {
            this.elements.chatContainer.hide(), this.elements.usersContainer.toggle(), this.elements.loginContainer.hide(), this.elements.palette.toggleClass("palette-sidebar", this.elements.usersContainer.is(":visible"))
        }.bind(this)), this.elements.loginToggle.click(function() {
            if (null !== this.username) return this.socket.emit("logout"), location.reload();
            this.elements.chatContainer.hide(), this.elements.usersContainer.hide(), this.elements.loginContainer.toggle(), this.elements.palette.toggleClass("palette-sidebar", this.elements.loginContainer.is(":visible"))
        }.bind(this)), this.elements.loginButton.click(function() {
            this.elements.loginButton.prop("disabled", !0), this.authenticate()
        }.bind(this)), this.elements.chatInput.keypress(function(t) {
            if (13 == t.which) {
                t.preventDefault();
                var e = this.elements.chatInput.val();
                if ("" === e) return;
                this.socket.emit("chat", e), this.elements.chatInput.val("")
            }
        }.bind(this))
    },
    initMoveTicker: function() {
        var t = $(".user-list"),
            e = $(".move-ticker-header"),
            i = $(".move-ticker-body");
        e.click(function() {
            i.toggle(), i.scrollTop(i.prop("scrollHeight")), i.is(":visible") ? t.addClass("user-list-ticker") : t.removeClass("user-list-ticker")
        })
    },
    updateTransform: function() {
        this.panX <= -this.width / 2 && (this.panX = -this.width / 2), this.panX >= this.width / 2 && (this.panX = this.width / 2), this.panY <= -this.height / 2 && (this.panY = -this.height / 2), this.panY >= this.height / 2 && (this.panY = this.height / 2), this.elements.boardMover.css("width", this.width + "px").css("height", this.height + "px").css("transform", "translate(" + this.panX + "px, " + this.panY + "px)"), this.elements.reticule.css("width", this.scale + "px").css("height", this.scale + "px"), this.elements.boardZoomer.css("transform", "scale(" + this.scale + ")")
    },
    screenToBoardSpace: function(t, e) {
        var i = this.elements.board[0].getBoundingClientRect();
        return {
            x: (t - i.left) / this.scale | 0,
            y: (e - i.top) / this.scale | 0
        }
    },
    boardToScreenSpace: function(t, e) {
        var i = this.elements.board[0].getBoundingClientRect();
        return {
            x: t * this.scale + i.left,
            y: e * this.scale + i.top
        }
    },
    centerOn: function(t, e) {
        this.panX = this.width / 2 - t - .5, this.panY = this.height / 2 - e - .5, this.elements.coords.text("(" + t + ", " + e + ")"), this.updateTransform()
    },
    switchColor: function(t) {
        this.color = t, null === t ? this.elements.cursor.hide() : (this.elements.cursor.show(), this.elements.cursor.css("background-color", t))
    },
    place: function(t, e) {
        null !== this.color && this.socket.emit("place", {
            x: t,
            y: e,
            color: this.color
        })
    },
    alert: function(t) {
        var e = this.elements.alert;
        if (null === t) return void this.elements.alert.fadeOut(200);
        e.find(".text").text(t), e.fadeIn(200)
    },
    updateTime: function(t) {
        if (void 0 !== t ? this.cooldown = t : this.cooldown -= 1, this.cooldown < 0 && (this.cooldown = 0), this.cooldown |= 0, 0 !== this.cooldown) {
            this.elements.timer.show();
            var e = Math.floor(this.cooldown % 60),
                i = e < 10 ? "0" + e : e,
                s = Math.floor(this.cooldown / 60),
                n = s < 10 ? "0" + s : s;
            this.elements.timer.text(n + ":" + i), $(".palette-color").css("cursor", "not-allowed"), setTimeout(this.updateTime.bind(this), 1e3)
        } else this.elements.timer.hide(), $(".palette-color").css("cursor", "")
    },
    spectate: function(t) {
        t.startsWith("@") && (t = t.substr(1)), this.alert("Spectating " + t), this.spectate_user = t
    },
    mention: function(t) {
        this.elements.usersContainer.hide(), this.elements.chatContainer.show(), t.startsWith("@") || (t = "@" + t), this.elements.chatInput.val(this.elements.chatInput.val() + t + " "), this.elements.chatInput.focus()
    },
    toURL: function() {
        window.open(this.elements.board[0].toDataURL(), "_blank")
    }
}, App.init();