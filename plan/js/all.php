<?php
$scripts = [
//    'https://unpkg.com/@fullcalendar/core/main.min.js',
//    'https://unpkg.com/@fullcalendar/daygrid/main.min.js',
//    'https://unpkg.com/@fullcalendar/list/main.min.js',
//    'https://unpkg.com/@fullcalendar/timegrid/main.min.js',
//    'https://unpkg.com/@fullcalendar/bootstrap/main.min.js',
    'calendar-pl.js',
    'gCal.js',
    'eventInfo.js',
    'sammy.min.js',
    'app.js'
];
$res = '';
foreach ($scripts as $filename) {
    $res .= file_get_contents($filename);
}
header('content-type: application/javascript; charset=UTF-8');
echo $res;
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

