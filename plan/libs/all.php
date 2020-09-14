<?php
if (filter_has_var(INPUT_GET, 'js')) {
    $scripts = [    
        'jquery-3.4.1.min.js',
        'popper.min.js',
        'bootstrap.min.js',
        'fullcalendar.min.js',
        'daygrid.fullcalendar.min.js',
        'list.fullcalendar.min.js',
        'timegrid.fullcalendar.min.js',
        'bootstrap.fullcalendar.min.js',
        'calendar-pl.js',
        //'sammy.min.js',
    ];
    $res = '';
    foreach ($scripts as $filename) {
        $res .= file_get_contents($filename)."

";
    }
    header('content-type: application/javascript; charset=UTF-8');
    echo $res;
}
if (filter_has_var(INPUT_GET, 'css')) {
    $styles = [
        'bootstrap.min.css',
        'fullcalendar.min.css',
        'daygrid.fullcalendar.min.css',
        'list.fullcalendar.min.css',
        'timegrid.fullcalendar.min.css'
    ];
    $res = '';
    foreach ($styles as $filename) {
        $res .= file_get_contents($filename)."

";
    }
    header('content-type: text/css; charset=UTF-8');
    echo $res;
}

