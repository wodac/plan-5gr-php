<?php
$url = 'https://calendar.google.com/calendar/ical/mjqvrp5umi78kgs1u289huc300%40group.calendar.google.com/public/basic.ics';
$c = curl_init();
curl_setopt_array($c, [
    CURLOPT_RETURNTRANSFER => 1,
    CURLOPT_URL => $url
]);
$res = curl_exec($c);
$res = preg_replace("<[d\b\n]+i[^i]+id=\"\w+\">", "\\n", $res);
$res = str_replace(['</a>','<br>',"<\\n>"], "\\n", $res);
$res = strip_tags($res);
$res = str_replace(["<",">"], "", $res);
//$res = preg_replace("<$", "\\n", $res);
header("content-type: text/calendar; charset=UTF-8");
echo $res;
/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

