if (navigator && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration('cache-sw.js').then(function(reg){
        if (typeof reg === 'undefined') 
            navigator.serviceWorker.register('/plan/cache-sw.js', {scope: '/plan/'})
            .then(function (reg) {
              // registration worked
              console.log('Registration succeeded: ' + reg);
            }).catch(function (error) {
              // registration failed
              console.log('Registration failed with ' + error);
            });
    });
}