/* global firebase, Notification, fetch, self */
function setupNotifications(opts, resolve, reject) {
    if (!opts.timeOfDay) opts.timeOfDay = '06:00';
    else {
        var regexp = /^\d\d:\d\d$/;
        var check = regexp.exec(opts.timeOfDay);
        if (check === null) throw Error('Nieprawidłowy format godziny');
    }
    if (fetch) {
        console.log('fetch avaible');
        var messaging, firebaseConfig = {
            apiKey: "AIzaSyA8K64pIiFz8-8b4yWIZGRnpwPfMWQByQU",
            authDomain: "plan-5-grupy.firebaseapp.com",
            databaseURL: "https://plan-5-grupy.firebaseio.com",
            projectId: "plan-5-grupy",
            storageBucket: "",
            messagingSenderId: "154281232054",
            appId: "1:154281232054:web:5e699ab9ffc7fccce10817"
        };
        var vapidKey = "BJ7PrLhK7i2t76SnLModJSFlpirRSHvQPyHIiu9a3yqMnECYy5A0KCAk3IZpjH_PKbsyqg9J9g3YyPaT8FASbQk";
        function getScript(url, cb) {
            console.log('getting script:',url,cb);
            if ($) return $.getScript(url, cb);
            else {
                importScripts(url);
                return cb();
            }
        }
        
        var tokenSent = false;
        function setTokenSentToServer(sent) {
            tokenSent = sent;
        }
        function updateUIForPushEnabled() {
            console.log('updateUIForPushEnabled');
        }

        function requestPermission() {
            Notification.requestPermission().then(function (permission) {
              if (permission === 'granted') {
                console.log('Notification permission granted.');
                return saveMessagingToken();
              } else {
                console.log('Unable to get permission to notify.');
              }
            });
        }

        function saveMessagingToken() {
            messaging.getToken().then(function (currentToken) {
              if (currentToken) {
                var prom = sendTokenToServerAsync(currentToken, opts);
                if (resolve) prom.then(resolve).catch(reject);
                updateUIForPushEnabled();
              } else {
                // Show permission request.
                console.log('No Instance ID token available. Request permission to generate one.');
                // Show permission UI.
                requestPermission();
                setTokenSentToServer(false);
              }
            }).catch(function (err) {
                console.log('An error occurred while retrieving token. ', err);
                setTokenSentToServer(false);
                if (reject) reject(err);
            });
        }
        
        getScript('https://www.gstatic.com/firebasejs/6.6.2/firebase-app.js', function(){
            console.log('firebase loaded');
            getScript('https://www.gstatic.com/firebasejs/6.6.1/firebase-messaging.js', function(){
                console.log('firebase messaging loaded');
                // Initialize Firebase
                firebase.initializeApp(firebaseConfig);
                messaging = firebase.messaging();
                messaging.usePublicVapidKey(vapidKey);

                console.log('requesting permission');
                requestPermission();

                // Callback fired if Instance ID token is updated.
                messaging.onTokenRefresh(function () {
                  messaging.getToken().then(function (refreshedToken) {
                    console.log('Token refreshed.');
                    // Indicate that the new Instance ID token has not yet been sent to the
                    // app server.
                    setTokenSentToServer(false);
                    // Send Instance ID token to app server.
                    return sendTokenToServerAsync(refreshedToken, opts);
                    // ...
                  }).catch(function (err) {
                    console.log('Unable to retrieve refreshed token ', err);
                    showToken('Unable to retrieve refreshed token ', err);
                  });
                });

                messaging.onMessage(function (payload) {
                  console.log('Message received. ', payload);
                  // ...
                });
            });
        });
    } else {
        console.log('fetch unavaible');
        return false;
    }
}

function sendTokenToServer(token, opts, resolve, reject) {
    console.log('sendTokenToServer',token);
    const formData = new FormData();
    formData.append('token', token);
    formData.append('timeOfDay', opts.timeOfDay);
    formData.append('modifyNotifications', opts.modifyNotifications);
    var promise = fetch('/plan/saveToken', {
        method: 'post',
        body: formData
    });
    if (resolve) promise.then(resolve).catch(reject);
}

function sendTokenToServerAsync(token, opts) {
    return new Promise(function(resolve, reject){
        return sendTokenToServer(token, opts, resolve, reject);
    });
}

function setupNotificationsAsync(opts) {
	return new Promise(function(resolve, reject){
		return setupNotifications(opts, resolve, reject);
	});
}


