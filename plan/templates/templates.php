<?php 
function startTemplate() {
    ob_start();
}
function endTemplate() {
    return ob_get_clean();
}

$templates = [];

startTemplate();
?>
<div class="row no-gutters my-2">
    <span class="icon fa fa-clock col-1"></span>
    <div class="content pl-2 col-10 col-md-11">[[time]]</div>
</div>
<?php
$templates['time'] = endTemplate();

startTemplate(); ?>
<div class="row no-gutters mb-2 position-relative">
    <span class="icon fa fa-map-marker-alt col-1"></span>
    <div class="content pl-2 col-9 col-md-10">
        [[location]]
    </div>
    <a href="[[locationURL]]" target="_blank" class="fa fa-arrow-right stretched-link location-link"></a>
</div>
<?php
$templates['location'] = endTemplate();

startTemplate(); ?>
<div class="row p-2 bg-light border-top">
    <div class="content col">
        [[description]]
    </div>                    
</div>   
<?php
$templates['description'] = endTemplate();

startTemplate(); ?>
<div class="row no-gutters mb-2 event-attachment-row">
    <span class="icon fa [[fileIcon]] fa-file-image col-1"></span>
    <div class="content col-10 col-md-11">
        <a href="[[fileUrl]]" class="streched-link event-attachment pl-2" target="_blank">[[fileName]]</a>
    </div>
</div>
<?php
$templates['attachment'] = endTemplate();

startTemplate(); ?>
<div class="event-info container">
    [[timeElement]]
    [[locationElement]]
    [[attachments]]
    [[descElement]]        
</div>
<?php
$templates['popoverBody'] = endTemplate();

startTemplate(); ?>
<tr class="event-info">
    <td colspan="3" class="border-0 p-0">
        <div class="event-info p-0">
            <div class="event-spacer"></div>
            [[locationElement]]
            [[attachments]]
            [[descElement]]             
        </div>
    </td>
</tr>
<?php
$templates['listDetails'] = endTemplate();

startTemplate(); ?>
<div class="fc-title mt-1 small event-info">[[location]]</div>
<?php
$templates['locationInGrid'] = endTemplate();

startTemplate(); ?>
<h3 class="popover-header">
    <span>[[title]]</span>
    <a class="fa fa-external-link-alt float-right" href="[[calendarLink]]" title="Otwórz w Kalendarzu Google" target="_blank"></a>
    <span class="float-right pl-3 pr-2 text-black-50">[[date]]</span>
    <span class="clearfix"></span></h3>
<?php
$templates['popoverHeader'] = endTemplate();


header('content-type: application/javascript; charset=UTF-8');
if (FALSE) { ?><script><?php } ?>
var templates = <?php echo json_encode($templates); ?>;
function t(name, params) {
    var result = templates[name];
    var keys = Object.keys(params);
    function getValue(value) {
        var res = value;
        if (typeof value !== 'string') {
            if (value instanceof $) res = value.get(0).outerHTML;
            if (value instanceof HTMLElement) res = value.outerHTML;
            if (value === null || typeof value === 'undefined') res = '';
            if (value instanceof Array) res = value.map(getValue).join('');
        } 
        return res;
    }
    keys.forEach(function(key){
        result = result.replace('[['+key+']]', getValue(params[key]));
    });
    return $(result);
}

<?php if (FALSE) { ?></script><?php } 