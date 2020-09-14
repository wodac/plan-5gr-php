/* global printView, FullCalendar, printPlugin, Function */
function formatDate(d) {
    d = new Date(d);
    var mon = d.getMonth() + 1;
    return d.getDate() + '.' + (mon>9 ? mon: '0'+mon);
}
function formatHour(d) {
    d = new Date(d);
    var min = d.getMinutes();
    return d.getHours() + ':' + (min>9 ? min: '0'+min);
}
function formatDuration(event) {
    var timeDesc;
    if (event.allDay) {
        if (event.end.valueOf() - event.start.valueOf() === 86400000) timeDesc = 'Cały dzień';
        else timeDesc = 'od ' + formatDate(event.start) + ' do ' + formatDate(event.end);
    } else {
        if (event.end.valueOf() - event.start.valueOf() < 86400000) timeDesc = formatHour(event.start) + ' - ' + formatHour(event.end);
        else {
            timeDesc = 'od ' + formatDate(event.start) + ' o ' + formatHour(event.start);
            timeDesc += ' do ' + formatDate(event.end) + ' o ' + formatHour(event.end);
        }
    }
    return timeDesc;
}
    
function GoogleCalendar(el, options) {
    this._firstLoad = !!options.preloadedEvents;
    this.element = el;
    this.options = options;
    this.getEvents = (function (fetchInfo, successCallback, failureCallback) {
        this.showEvents = successCallback;
        this.onfailure = failureCallback;
        this.loadEvents(this.options.url, fetchInfo);
    }).bind(this);
    this.loadEvents = (function (url, options) {
        if (this._firstLoad) {
            this.parseEvents(this.options.preloadedEvents);
            this._firstLoad = false;
        } else 
        $.get({
            url: url,
            context: this,
            data: {
                get: 1,
                timeMin: options.start.toISOString(),
                timeMax: options.end.toISOString()
            },
            success: this.parseEvents,
            error: this.onfailure
        });
    }).bind(this);
    this.onfailure = console.log;
    this.parseEvents = (function (data) {
        var calendars = this.options.calendars;
        var calendarNames = Object.keys(calendars);
        var parser = this.parseEvent;
        var events = calendarNames.reduce(function(result, calName){
            var mapped = data[calName]
                .map(function (el) {
                    el = parser(el);
                    el.classNames.push(calendars[calName]);
                    return el;
                })
                .filter(function(el){
                    return typeof el !== 'undefined';
                });          
            return result.concat(mapped);
        }, []);
        this.showEvents(events);
    }).bind(this);
    this.parseEvent = (function (event) {
        if (event.start) {
            var isAllDay = typeof event.start.dateTime === 'undefined';
            var color = GoogleCalendar.COLORS[
                    parseInt(event.colorId, 10)-1
                ];
            var classNames = [];
            if (event.uncertain) classNames.push('uncertain');
            if (event.lecture) classNames.push('lecture');
            var parsed = {
                id: event.id,
                title: event.summary,
                allDay: isAllDay,
                start: !isAllDay ? event.start.dateTime : event.start.date,
                end: !isAllDay ? event.end.dateTime : event.end.date,
                url: '#', //event.htmlLink,
                classNames: classNames,
                backgroundColor: color,
                borderColor: color,
                extendedProps: Object.assign({},event)
            };
            if (event.background) parsed.rendering = 'background';
            return parsed;
        }
    }).bind(this);
    this.eventClick = (function (info) {
        info.jsEvent.stopPropagation();
        info.jsEvent.preventDefault();
        var vType = this.calendar.view.type;
        if (vType === 'weekList') {
            var cont = $(info.el).next('tr.event-info');
            if (!cont.length) {
                var details = new EventInfo(info.el, info.event);
                details.showInList();
            } else {
                cont.remove();
            }
            return;
        }
        $('body').click(function(){
            $(info.el).popover('hide');
        });
    }).bind(this);
    this.eventMouseEnter = (function (info) {
//        var vType = this.calendar.view.type;
//        
    }).bind(this);
    this.eventMouseLeave = (function (info) {        
//        var $el=$(info.el);
//        
    }).bind(this);
    this.onloadstart = (function (info) {
        if (this.options.onloadstart) this.options.onloadstart.bind(this)({
            fetchInfo: info//,
            //view: this.calendar.view
        });
    }).bind(this);
    this.onloadend = (function () {
        if (this.options.onloadend) {
            this.options.onloadend.bind(this)(this.calendar);
        }
    }).bind(this);
    this.loading = (function (started) {
        if (started) this.onloadstart();
        else this.onloadend();
        console.log("loading "+(started?'started':'ended'));
    }).bind(this);
    
    this.renderEvents = (function(info) {
        var vType = this.calendar.view.type;
        var c = new EventInfo(info.el, info.event);
        if (vType === 'month' || vType === 'timeGridWorkdays') {
            c.makePopover();
        }
        if (vType === 'printMonth' || vType === 'timeGridWorkdays') {
            if (vType === 'printMonth') {
                var t = c.$el.find('.fc-time');
                t.addClass('d-block');
                t.html(formatDuration(info.event));
                c.insertInGrid();
            } else if (!this.options.isMobilePortrait) c.insertInGrid();
        }
        if (vType === 'printWeek') {
            setTimeout(function () {
                c.showInList();
            }, 0);
        }
    }).bind(this);
    this.getToolbarOpts = (function(isMobile) {
        var opts = {};
        var btnsDesc = ['prev,next today'].concat(this.buttonKeys).join(' ');
        if (!isMobile) 
            opts.header = {
                left: btnsDesc,
                center: 'title',
                right: 'month,weekList,timeGridWorkdays'
            };
        else {
            opts.footer = {left: btnsDesc};
            opts.header = {
                left: 'title',
                center: '',
                right: ''
            };
        }
        return opts;
    }).bind(this);
    
    this.onrender = (function(info) {
//        $('.fc-weekList-view .fc-scroller').removeClass(['mb-5']);
//        $('.fc-weekList-view .fc-scroller:has(.fc-list-empty-wrap2)').addClass(['mb-5']);
    }).bind(this);
    this.getView = (function() {
        var state = this.get('state');
        var type = state.viewType;
        var date = state.currentDate;
        return {
            type: type,
            date: date
        };
    }).bind(this);
    this.get = (function(key) {
        try {
            var res = this.calendar[key];
            if (res instanceof Function) res = res.bind(this.calendar);
            return res;
        } catch(e) {
            return;
        }
//        $('.fc-weekList-view .fc-scroller').removeClass(['mb-5']);
//        $('.fc-weekList-view .fc-scroller:has(.fc-list-empty-wrap2)').addClass(['mb-5']);
    }).bind(this);
    
    var buttons = this.options.buttons ? this.options.buttons : {};
    buttons.changeView = {
        text: '',
        icon: 'fa-calendar',
        click: function (e) {
            e.stopPropagation();
            var $el = $(e.target);
            var content = $('<div></div>');
            content.addClass('container');
            content.css('textAlign','center');
            function btnFact(text,cls,act) {
                var btn = $('<a href="#"></a>');
                btn.addClass(['btn','btn-primary']);
                btn.html(text);
                btn.click(act);
                var btnWrapped = $('<div class="row"></div>');
                $('<div></div>').addClass(['col'].concat(cls))
                        .append(btn).appendTo(btnWrapped);
                return btnWrapped;
            }
            content.append(btnFact('Miesiąc',['py-2'], (function(){
                this.calendar.changeView('month');
            }).bind(this)));
            content.append(btnFact('Lista tygodnia', ['pb-2'], (function(){
                this.calendar.changeView('weekList');
            }).bind(this)));
            content.append(btnFact('Siatka tygodnia', ['pb-2'], (function(){
                this.calendar.changeView('timeGridWorkdays');
            }).bind(this)));
            $el.popover({
                placement: 'top',
                trigger: 'manual',
                title: 'Wybierz widok',
                html: true,
                content: content.get(0)
            });
            $el.popover('show');
            $('body').one('click',function(){
                $el.popover('dispose');
            });
            return false;
        }
    };
    
    this.buttonKeys = Object.keys(buttons);
    var buttonIcons = {};
    this.buttonKeys.forEach(function(key){
        if (buttons[key].icon) buttonIcons[key] = buttons[key].icon;
        buttons[key].click = buttons[key].click.bind(this);
    }, this);
    
    var initOpts = {
        locale: 'pl',
        plugins: [ 'bootstrap', 'dayGrid', 'list', 'timeGrid' ], 
        themeSystem: 'bootstrap',
        theme: 'bootstrap',
        defaultView: this.options.isMobilePortrait?'weekList':'month', 
        views: {
            timeGridWorkdays: {
                type: 'timeGridWeek',
                weekends: this.options.includeWeekends || false,
                minTime: "07:00:00",
                maxTime: "20:00:00",
                buttonText: 'Siatka tygodnia'
            },
            month: {
                type: 'dayGridMonth',
                weekends: this.options.includeWeekends || false//,
//                visibleRange: function(currentDate) {
//                    console.log('visibleRange:',currentDate);
//                    var startDate = new Date(currentDate.valueOf());
//                    var endDate = new Date(currentDate.valueOf());
//                    endDate.setDate(28);
//                    startDate.setDate(1);
//                    var days = startDate.getDay()-1;
//                    days = days * 1000 * 60 * 60 * 24;
//                    startDate = new Date(startDate.valueOf()-days);
//                    var o = { start: startDate, end: endDate };
//                    console.log(o);
//                    return o;
//                }
            },
            weekList: {
                type: 'listWeek',
                buttonText: 'Plan tygodnia'
            },
            printMonth: {                
                type: 'dayGridMonth',
                weekends: false
            },
            printWeek: {                
                type: 'listWeek'
            }
        },
        eventRender: this.renderEvents,
        events: this.getEvents,
        eventClick: this.eventClick,
        eventMouseLeave: this.eventMouseLeave,
        eventMouseEnter: this.eventMouseEnter,
        customButtons: buttons,
        bootstrapFontAwesome: buttonIcons,
        titleFormat: this.options.titleFormat,
        viewSkeletonRender: this.onrender,
        // datesDestroy: this.onloadstart,
        height: 'auto',
        loading: this.loading
    };
    var opts = this.getToolbarOpts(this.options.isMobilePortrait);
    initOpts.header = opts.header;
    initOpts.footer = opts.footer;
    if (this.options.fullCalendar) {
        var rawOpts = this.options.fullCalendar;
        Object.keys(rawOpts).forEach(function(opt){
            var res = rawOpts[opt];
            if (res instanceof Function) res = res.bind(this);
            initOpts[opt] = res;
        }, this);
    }
    console.log('FullCalendar.Calendar -> opts:',initOpts);
    this.calendar = new FullCalendar.Calendar(this.element, initOpts);
    this.render = this.get('render');
}
GoogleCalendar.COLORS = ["rgb(164, 189, 252)", "rgb(122, 231, 191)", "rgb(189, 173, 255)", "rgb(255, 136, 124)", "rgb(251, 215, 91)", "rgb(255, 184, 120)", "rgb(70, 214, 219)", "rgb(225, 225, 225)", "rgb(84, 132, 237)", "rgb(81, 183, 73)", "rgb(220, 33, 39)"];