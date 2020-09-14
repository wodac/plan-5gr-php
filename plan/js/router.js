function Router(sel, options) {
    this.el=$(sel);
    this.options = options;
    var ctx = this;
    var date, view, previousPage, dialogShown;
    var syncSettings = new SettingsFactory({
        lastSynced: [{
                value: new Date('2019-10-09')
            }, 'value']
    });
    function changeCalendarView(opts) {
        if (!opts.type || opts.type !== view || !opts.date || opts.date !== date) {
            ctx.options.changeCalendarView(opts);
            if (opts.date) date = opts.date;
            if (opts.type) view = opts.type;
        } else console.log('already on:', opts);
    }
    this.sammy = Sammy(sel, function(){
        this.after(function(){
            previousPage = ctx.sammy.getLocation();
        });
        this.before(function(){
            if (dialogShown) {
                options.hideDialog(dialogShown);
                dialogShown = false;
            }
        });
        this.get('/plan/',function(){
            var v = ctx.options.getCalendarView();
            ctx.updateDate(v);
        });
        this.get('/plan/sync',function(){
            console.log('sync clicked');
            $('a.fa-sync.nav-link').addClass('rotating');
            $.ajax({
                url: '/plan/events.php',
                data: {
                    getSynced: true,
                    lastSynced: syncSettings.get('lastSynced')
                },
                success: function () {                    
                    syncSettings.set('lastSynced', new Date());
                    console.log('events synced');
                },
                complete: function () {
                    $('a.fa-sync.nav-link').removeClass('rotating');
                }
            });
            ctx.sammy.setLocation(previousPage);
        });
        this.get('/plan/month/:year/:month', function(){
            console.log('get',this);
            var year = Number(this.params.year);
            var month = Number(this.params.month);
            try {
                var d = year+'-'+(month>9?month:'0'+month)+'-01';
                changeCalendarView({
                    date: d,
                    type: 'month'
                });
            } catch (e) {
                console.log(e);
                this.redirect('/plan/');
            }
        });
        this.get('/plan/dialog/:name', function(){
            options.showDialog(this.params.name, function(){
                ctx.sammy.setLocation(previousPage);
            });
            dialogShown = this.params.name;
        });
//        this.get('#/settings', function(){
//            console.log('route settings',this);
//            ctx.options.showDialog('settingsDialog', function(){
//                ctx.sammy.setLocation(previousPage);
//            });
//            dialogShown = 'settingsDialog';
//        });
        this.get('/plan/:type', function(){
            console.log('get',this);
            try {
                changeCalendarView({
                    type: this.params.type
                });
            } catch (e) {
                console.log(e);
                this.redirect('/plan/');
            }
        });
        this.get('/plan/:type/:year/:month/:day', function(){
            console.log('get',this);
            var year = Number(this.params.year);
            var month = Number(this.params.month);
            var day = Number(this.params.day);
            try {
                var d = year+'-'+(month>9?month:'0'+month)+'-'+(day>9?day:'0'+day);
                changeCalendarView({
                    date: d,
                    type: this.params.type
                });
            } catch (e) {
                console.log(e);
                this.redirect('/plan/');
            }
        });        
    });
    this.sammy.debug = true;
    this.run = this.sammy.run.bind(this.sammy);
    this.updateDate = (function (v) {
        //changeCalendarView(v);
        var loc = '/plan/' + v.type;
        loc += '/' + v.date.getFullYear();
        loc += '/' + (v.date.getMonth()+1);
        if (v.type !== 'month') {
            loc += '/' + v.date.getDate();
        }
        this.sammy.setLocation(loc);
    }).bind(this);
}