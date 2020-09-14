var Controller = function (settings) {
    this.settings = settings;
    this.settingsList = settings.settingsList;
    this.config = settings.config;
    this.handlers = settings.handlers;
};
Controller.setupConfig = function(config) {
    var el = config;
    if (typeof config !== 'object') throw TypeError();
    if (config instanceof HTMLElement) el = $(config);
    if (el instanceof $) {
        var result = {};
        var valueInputs = el.find('input').not("[type='checkbox']").not("[type='submit']");
        var checkBoxes = el.find("input[type='checkbox']");
        valueInputs.each(function(i, el){
            result[el.name] = [el, 'value'];
        });
        checkBoxes.each(function(i, el){
            result[el.name] = [el, 'checked'];
        });
        return result;
    } else return config;
};

Controller.prototype = {
    getElement: function(key) {
        return this.config[key][0];
    },
    setElement: function(key, elem, prop) {
        this.config[key][0] = elem;
        this.config[key][1] = prop;
    },
    get: function(key) {
        var ref = this.config[key];
        if (ref && ref[0] && ref[1]) return ref[0][ref[1]];
    },
    set: function(key, value) {
        var ref = this.config[key], proceed = true;                    
        if (this.handlers && this.handlers.onupdate) proceed = this.handlers.onupdate.bind(this)(key, value);
        if (proceed !== false && ref && ref[0] && ref[1]) ref[0][ref[1]] = value;
    },
    getAll: function() {
        var result = {};
        this.settingsList.forEach(function(key){
            result[key] = this.get(key);
        }, this);
        return result;
    },
    transactionEnd: function (cb) {
        console.log('transactionEnd',cb);
        if (!this.onTransactionEnd) this.onTransactionEnd = [];
        this.onTransactionEnd.push(cb);
    },
    _endTransaction: function () {
        if (this.onTransactionEnd) this.onTransactionEnd.forEach(function(cb){
            console.log('_endTransaction',cb);
            cb.call(this);
        }, this);
        this.onTransactionEnd = [];
    }
};

function SettingsFactory(config, handlers) {    
    if (!localStorage) throw Error("LocalStorage API not supported");
    
    this.config = Controller.setupConfig(config);
    this.handlers = handlers;
    this.settingsList = Object.keys(this.config);
    this.controller = new Controller(this);
    this.defaultSettings = this.controller.getAll();
    this.settings = {};
    this.getSettings();
};

SettingsFactory.prototype = {
    
    get: function (key) {
        return this.getSettings()[key];
    },
    
    set: function (key, value) {
        if (this.settings[key] !== value) {
            localStorage.setItem(key, JSON.stringify(value));
            this.settings[key] = value;
            if (this.handlers && this.handlers.onchange) 
                this.handlers.onchange(key, value, this.controller.transactionEnd.bind(this.controller));
        }
    },
    
    changeSettings: function () {
        this.iterate(function(key){
            try {
                var toStore = this.controller.get(key);
                if (typeof toStore !== 'undefined') {;
                    this.set(key, toStore);
                }
                this.controller._endTransaction();
            } catch (e) {
                console.log(e);
            }
        });
    },
    
    iterate: function (fn) {
        this.settingsList.forEach(function(key){
            var value = this.settings[key];
            return fn.bind(this)(key, value);
        }, this);
    },
    
    getSettings: function () {
        this.iterate(function (key) {
            var stored = localStorage.getItem(key);
            try {
                var value = JSON.parse(stored);
                if (value !== null) this.settings[key] = value;
                else throw Error();
            } catch (e) {
                var value = this.defaultSettings[key];
                this.set(key, value);
            }
        });
        return this.settings;
    },

    updateUI: function () {
        this.iterate(this.controller.set);
    }
};