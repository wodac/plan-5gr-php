function EventInfo(el, event, view) {
    this.$el = $(el);
    this.event = event;
    this.eventInfo = event.extendedProps;
    function getTimeEl(event) {
        var timeDesc = formatDuration(event);
        var el = t('time',{time: timeDesc});
        return el;
    }
    function getLocationEl(location) {
        var url = 'http://maps.google.com/?q='+encodeURI(location);
        return t('location', {
            location: location,
            locationURL: url
        });
    }
    function getDescEl(descStr) {
        var desc = t('description', {
            description: descStr
        });
        desc.find("#links").removeAttr('id').addClass('event-links');
        desc.find("#units").removeAttr('id').addClass('event-units');
        desc.find("#desc").removeAttr('id').not(":empty").addClass(['event-desc','mt-1','p-2','card','card-body']);
        desc.find('a').attr('target','_blank');
        desc.find('a').each(function (el) {
            $(el).attr('title',$(el).attr('href'));
        });
        return desc;
    }
    function getAttachEl(att) {
        var params = {
            fileUrl: att.fileUrl, 
            fileName: att.title
        };
        switch (att.mimeType) {
            case "application/pdf":
                params.fileIcon = 'fa-file-pdf';
                break;
                
            case "image/jpeg":                
                params.fileIcon = 'fa-file-image';
                break;
                
            default:
                params.fileIcon = 'fa-file';
        }
        return t('attachment', params);
    }
    
    this.makeTitle = (function () {
        return this.title = t('popoverHeader', { 
            title: this.event.title,
            calendarLink: this.eventInfo.htmlLink,
            date: this.event.allDay ? '' : formatDate(this.event.start)
        });
    }).bind(this);
    
    this.getParams = (function (elements) {
        var params = {
            timeElement: '',
            locationElement: '',
            descElement: '',
            attachments: ''
        };
        if (elements.indexOf('timeElement') != -1)
            params.timeElement = getTimeEl(this.event);
        if (elements.indexOf('locationElement') != -1 && this.eventInfo.location)
            params.locationElement = getLocationEl(this.eventInfo.location);
        if (elements.indexOf('descElement') != -1 && this.eventInfo.description)
            params.descElement = getDescEl(this.eventInfo.description);
        if (elements.indexOf('attachments') != -1 && this.eventInfo.attachments) {
            params.attachments = this.eventInfo.attachments.map(getAttachEl);
        }
        return params;
    }).bind(this);
    
    this.makePopover = (function () {
        this.makeTitle();
        this.$el.popover({
            title: this.title.html(),
            html: true,
            content: t('popoverBody', 
                this.getParams([
                    'timeElement',
                    'locationElement',
                    'descElement',
                    'attachments'
                ])
            ),
            trigger: 'click hover',
            delay: 300,
            boundary: 'viewport'
        });
        //this.$el.popover('show');
    }).bind(this);
    this.showInList = (function () {
        this.$el.after(
                t('listDetails', 
                    this.getParams([
                        'locationElement',
                        'descElement',
                        'attachments'
                    ])
                )
            );
    }).bind(this);
    this.insertInGrid = (function () {
        var container = this.$el.find(".fc-content");
        container.append(
                t('locationInGrid', {
                    location: this.eventInfo.location
                })
                );
    }).bind(this);
};