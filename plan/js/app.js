/* global preloadedEvents */

var calendarEl = document.getElementById('calendar');
var gscriptUrl = 'https://plan5gr.azurewebsites.net/events';
var calendar, isPrinting, Settings;

function setupKBDEvents(cal) {
    function sequentialFocus(dir) {
        var events = $(calendarEl).find('.fc-event');
        if (events.length) {
            var i = events.index(document.activeElement) + dir;
            i = i < 0 ? 0 : i;
            events.get(i).focus();
        }
    }
    document.body.onkeyup = function (e) {
        switch (e.keyCode) {
            case 39: //right arrow
                cal.next();
                break;
                
            case 37: //left arrow
                cal.prev();
                break;
                
            case 40: //down arrow
                e.preventDefault();
                sequentialFocus(1);
                break;
                
            case 38: //up arrow
                e.preventDefault();
                sequentialFocus(-1);
                break;
                
            case 77: //m
                cal.changeView('month');
                break;
                
            case 87: //w
                cal.changeView('weekList');                
                break;
                
            case 191: //?
                // help               
                break;
                
            default:
                console.log(e);
        }
    };
}
function setupTouchEvents(cal) {
    var tresholdSwipe = 100;
    var tresholdMove = 20;
   var xStart, yStart;
   calendarEl.ontouchstart = function (e) {
           xStart = e.changedTouches[0].clientX;
           yStart = e.changedTouches[0].clientY;
           calendarEl.classList.add("to-transform");
   };
   function getHorizontalSwipe (e) {
           var dx = e.changedTouches[0].clientX-xStart;
           var dy = e.changedTouches[0].clientY-yStart;
           if (Math.abs(dx)>Math.abs(dy)) {
                   return dx;
           } else return false;
   }
   calendarEl.ontouchend = function(e){
           var dx = getHorizontalSwipe(e);
           if (dx && dx < -tresholdSwipe)
                   cal.next();
           if (dx && dx > tresholdSwipe)
                   cal.prev();
           var cl=calendarEl.classList;
           cl.remove("to-transform");
           cl.remove("swiped-left");
           cl.remove("swiped-right");
   };
   calendarEl.ontouchmove = function (e) {
           var dx = getHorizontalSwipe(e);
           if (dx) {
                   e.preventDefault();
                   var cl=calendarEl.classList;
                   if (dx < -tresholdMove) cl.add("swiped-left");
                   if (dx > tresholdMove)  cl.add("swiped-right");
           }
   };
}
var getPrintHandlers = function (cal) {
    var prevView;
    return {
        before: function () {
            console.log('onbeforeprint',new Date());
            isPrinting = true;
            $('.fc-print-button').tooltip('hide');
            prevView = cal.view.type; 
            if (prevView === 'month') cal.changeView('printMonth');
            if (prevView === 'weekList' || prevView === 'timeGridWorkdays') cal.changeView('printWeek');
        }, 
        after: function () {
            console.log('onafterprint', new Date());
            cal.changeView(prevView);        
            isPrinting = false;
        }
    };
};
function setupPrintEvents(cal) {
    var ph = getPrintHandlers(cal);
    document.body.onbeforeprint = ph.before;
    document.body.onafterprint = ph.after;
}

$(function(){     
    var loadScriptOnce = (function(){
        var loadedScripts = [];
        return function (url, cb) {
            if (loadedScripts.indexOf(url)===-1) {
                var res = $.getScript(url, cb);
                loadedScripts.push(url);
                return res;
            } else return false;
        };
    })();
    var settingsForm = $('#settingsForm');
    Settings = new SettingsFactory(settingsForm, {
        onupdate: function (key, value) {
            if (key === 'showNotifications') {
                if (value) $('#collapseNotifications').addClass('show');
                else $('#collapseNotifications').removeClass('show');
            } 
        },
        onchange: function (key, value, ended) {
            console.log(key, 'changed to', value);
            if (key === 'showNotifications') {
                if (value) {
                    ended(function(){
                        //var time = this.settings.get('timeForNotification');
                        var modifyNotifications = this.settings.get('modifyNotifications');
                        loadScriptOnce('/plan/js/useFireBase.js', function(){
                            setupNotifications({
                                modifyNotifications: modifyNotifications
                                //timeOfDay: time
                            });
                        });
                    });
                } //else 
            } else if (key === 'showLectures') {
                ended(function(){
                    document.getElementById('calendar')
                    .classList[value ? 'remove' : 'add']('hideLectures');
                });
            } else if (key === 'usePWA') {
                if (value) {
                    document.cookie = 'withPWA=true; expires='+(new Date(Date.now()+1000*3600*72).toUTCString());
                    alert('Aby załadować aplikację offline, należy odświeżyć stronę.');
                    //history.back();
                    //location.reload();
                } else if (!value) {
                    document.cookie = 'withPWA=false; expires='+(new Date(Date.now()+1000*3600*72).toUTCString());
                    if (navigator.serviceWorker)
                        navigator.serviceWorker
                            .getRegistration('cache-sw.js')
                            .then(function(reg){
                                if (reg) return reg.unregister();
                            });
                }                    
            }
            ended(function(){Settings.updateUI;});
        }
    });    
    Settings.updateUI();
    if (Settings.get('showNotifications')) {
        loadScriptOnce('/plan/js/useFireBase.js', function(){
            setupNotifications({
                modifyNotifications: Settings.get('modifyNotifications')
            });
        });
    }
    if (Settings.get('usePWA')) {
        loadScriptOnce('/plan/js/initPWA.js');
        var syncSettings = new SettingsFactory({
            lastSynced: [{
                    value: new Date('2019-10-09')
                }, 'value']
        });
        var lastSynced = new Date(syncSettings.get('lastSynced'));
        $('.sync-link').removeClass('d-none');
        $('#lastUpdated').text(lastSynced.toLocaleString());
    }
    if (!Settings.get('showLectures')) {
        document.getElementById('calendar')
            .classList.add('hideLectures');
    }
    
    var startDate = new Date();
    var startView = window.innerWidth < 992 ? 'weekList' : 'month';
    var router = new Router("body", {
        changeCalendarView: function (view) {
            startDate = view.date;
            startView = view.type;
        },
        getCalendarView: function () {
            return {
                date: startDate,
                type: startView
            };
        },
        showDialog: function (name) {
            var modal = $('.modal.'+name);
            modal.modal('show');
            modal.on("hidden.bs.modal", function () {
                history.back();
            });
        },
        hideDialog: function (name) {
            $('.modal.'+name).modal('hide');
        }
    });
    router.run();
    calendar = new GoogleCalendar(calendarEl, {
        url: gscriptUrl,
        isMobilePortrait: window.innerWidth < 992,
        calendars: {
            schedule: "schedule",
            exams: "exams"
        },
        includeWeekends: !Settings.get('hideWeekends'),
        buttons: {
            addToOwnCalendar: {
                text: '',
                click: function() {
                  console.log('addToOwnCalendar');
                  $('.modal.addScheduleDialog').modal('show');
                },
                icon: 'fa-plus'
            },
            print: {
                text: '',
                click: function() {
                    var ph = getPrintHandlers(this.calendar);
                    ph.before();
                    print();
                    ph.after();
                },
                icon: 'fa-print'
            }
        },
        onloadstart: function (i) {
            console.log('onloadstart:',i);
            $('.loading-container').removeClass('d-none');
        },
        onloadend: function (v) {
            console.log('onloadend:',v);
            $('.loading-container').addClass('d-none');
            router.updateDate(this.getView());          
        },
        preloadedEvents: false,
        fullCalendar: {
            defaultDate: startDate,
            defaultView: startView,
            windowResize: function(){
                if (!isPrinting) {
                    var setOpt = this.get('setOption');
                    var opts = this.getToolbarOpts(window.innerWidth < 992);
                    setOpt('header', opts.header);
                    setOpt('footer', opts.footer);
                }
            }
        }
    });
    calendar.render();
    router.options.changeCalendarView = function (view) {
        var currView = calendar.get('view');
        if (currView.type !== view.type || currView.currentDate !== view.date) {
            calendar.calendar.changeView(view.type, view.date);
        }
    };
    router.options.getCalendarView = function () {
        var currView = calendar.getView();
        return currView;
    };
    
    setupTouchEvents(calendar.calendar);
    setupKBDEvents(calendar.calendar);
    setupPrintEvents(calendar.calendar);
    
    $('.copy.input-group-append').click(function(e){
        var parent = $(e.target).parentsUntil().filter('.input-group');
        console.log(parent);
        var input = parent.find('input').get(0);
        input.focus();
        input.select();
        document.execCommand('copy', false);
    });
    
    settingsForm.submit(function(e){
        e.preventDefault();
        var f = e.target;
        Settings.changeSettings();
        //Settings.updateUI();
        var saved = f.querySelector('.saved');
        saved.classList.add('show');
        setTimeout(function(){
            saved.classList.remove('show');
        }, 3000);
        return false;
    });
    	
    $('.fc-addToOwnCalendar-button').tooltip({
        title: 'Dodaj do własnego kalendarza',
        placement: 'bottom'
    });
    $('.fc-print-button').tooltip({
        title: 'Drukuj...',
        placement: 'bottom'
    });
    $('.nav-item .nav-link').tooltip({
        placement: 'bottom'
    });
});

