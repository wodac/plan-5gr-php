<?php
include 'commons.php';
$debug = FALSE;

function syncEvents($res) {    
    $debug = TRUE;
    $db = setupDB();
    $params = getParams($db);
    var_dump($params);
        
    $dateRetrieved = date('c');
    $res = $res ? $res : makeRequest($params);
    var_dump($res);
    
    if ($res->fullSyncRequired) {
        resetEventStore($db);
    }
    
    //$db->beginTransaction();
    try {
        addEvents($db, $res->schedule->added, 'schedule');
        addEvents($db, $res->exams->added,    'exams');

        modifyEvents($db, $res->schedule->modified, 'schedule');
        modifyEvents($db, $res->exams->modified,    'exams');

        deleteEvents($db, $res->schedule->cancelled, 'schedule');
        deleteEvents($db, $res->exams->cancelled,    'exams');

        if (!$debug) {
            storeParams($db, [
                "lastRetrieved" => $dateRetrieved,
                "scheduleSyncToken" => $res->schedule->nextSyncToken,
                "examsSyncToken" => $res->exams->nextSyncToken
            ]);
        }
        //$db->commit();
    } catch (Exception $e) {
        var_dump($e);
        //$db->rollBack();
    }
}

function getParams($db) {
    $getParamsStm = $db->prepare('select * from `syncData`');
    $getParamsStm->execute();
    $params = [];
    while ($row = $getParamsStm->fetch()) {
        $params[$row['name']] = $row['value'];
    }
    $getParamsStm->closeCursor();
    return $params;
}

function storeParams(\PDO $db, $params) {
    $q = "UPDATE `syncData` SET `value`=:value WHERE `name` = :name";
    $stm = $db->prepare($q);
    foreach ($params as $name => $value) {
        $stm->bindValue(':name', $name);
        $stm->bindValue(':value', $value);
        if (!$stm->execute()) {
            throw new Exception('Błąd zapisu metadanych synchronizacji');
        }
        $stm->closeCursor();
    }
}

function makeRequest($params) {
    $params['action'] = 'syncEvents';
    $url = 'https://script.google.com/macros/s/AKfycbyrALm8xhIL7J_YQqAQsZNyress3_2xPtlskzCx7_rPQDIwBys/exec';
    $url .= '?'.http_build_query($params);
    
    var_dump($url);
    $c = curl_init();
    curl_setopt_array($c, [
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_URL => $url,
        CURLOPT_FOLLOWLOCATION => true
    ]);
    $res = json_decode(curl_exec($c));
    if ($res->error) {
        throw new Exception($res->error);
    } else {
        return $res;
    }
}
function getDesc($item) {
    $MONTHS = [
        'stycznia', 'lutego', 'marca', 
        'kwietnia', 'maja', 'czerwca',
        'lipca', 'sierpnia', 'września', 
        'października', 'listopada', 'grudnia'
    ];
    $desc = '"'.$item->summary.'"';
    $duration = getDuration($item);
    $startDT = $duration['startDT'];
    if (!$duration['allDay']) $desc .= ' o '. $desc .= ' o '. $startDT->format('H:i');
    $desc .= ' ' . $startDT->format('d ');
    $month = (int) $startDT->format('m');
    $desc .= $MONTHS[$month-1];
    $desc .= $startDT->format(' Y');
    return $desc;
}
function getID($item) {
    return $item->id;
}
function addEvents($db, $items, $kind) {
    $q = "INSERT INTO `events`(`id`, `type`, `start`, `end`, `json`) VALUES (:id,:kind,:start,:end,:json)";    
    execUpdateQuery($db, $items, $kind, $q);
    echo $kind.' - added: '.implode(', ', array_map(getDesc, $items)).'<br>';
}
function modifyEvents($db, $items, $kind) {
    $q = "UPDATE `events` SET `start`=:start,`end`=:end,`json`=:json WHERE `id` = :id AND `type` = :kind";
    execUpdateQuery($db, $items, $kind, $q);
    echo $kind.' - modified: '.implode(', ', array_map(getDesc, $items)).'<br>';
}
/* class EventDuration {
    public function __construct($item) {
        $start = $item->start->dateTime;
        $end = $item->end->dateTime;
        $this->allDay = $start == NULL;
        if ($allDay) {
            $f = 'Y-m-d';
            $this->startDT = DateTime::createFromFormat($f, $item->start->date, $TIMEZONE);
            $this->endDT = DateTime::createFromFormat($f, $item->end->date, $TIMEZONE);
        } else {
            $f = 'Y-m-d\TH:i:sP';
            $this->startDT = DateTime::createFromFormat($f, $start, $TIMEZONE);
            $this->endDT = DateTime::createFromFormat($f, $end, $TIMEZONE);        
        }
        $this->start = $startDT->getTimestamp();
        $this->end = $endDT->getTimestamp();
    }
} */
function getDuration($item) {
    $start = $item->start->dateTime;
    $end = $item->end->dateTime;
    $allDay = $start == NULL;
    if ($allDay) {
        $f = 'Y-m-d';
        $startDT = DateTime::createFromFormat($f, $item->start->date, $TIMEZONE);
        $endDT = DateTime::createFromFormat($f, $item->end->date, $TIMEZONE);
    } else {
        $f = 'Y-m-d\TH:i:sP';
        $startDT = DateTime::createFromFormat($f, $start, $TIMEZONE);
        $endDT = DateTime::createFromFormat($f, $end, $TIMEZONE);        
    }
    $startT = $startDT->getTimestamp();
    $endT = $endDT->getTimestamp();
    return [
        'start'=> $startT,
        'end'  => $endT,
        'startDT' => $startDT,
        'endDT' => $endDT,
        'allDay' => $allDay
    ];
}
function execUpdateQuery($db, $items, $kind, $query) {
    $stm = $db->prepare($query);
    foreach ($items as $item) {
        $stm->bindValue(':kind', $kind);
        $stm->bindValue(':id', $item->id);
        $duration = getDuration($item);
        $stm->bindValue(':start', $duration['start']);
        $stm->bindValue(':end', $duration['end']);
        processItemTags($item);
        $stm->bindValue(':json', json_encode($item));
        if (!$stm->execute()) {
            throw new Exception('Błąd zapisu synchronizacji');
        }
        $stm->closeCursor();
    }
}
function processItemTags(&$item) {
    $tagLabels = [
        '?' => 'uncertain',
        'WYKŁAD' => 'lecture',
        'BEZBLOCZE' => 'background',
        'WAKACJE WIOSENNE' => 'background',
        'PRZERWA WIOSENNA' => 'background',
        'WOLNE' => 'background',
        'FERIE ZIMOWE' => 'background',
        'DZIEŃ REKTORSKI' => 'background'
    ];
    $summary = $item->summary;
    $tags = explode("]", $summary);
    $item->summary = preg_replace('/^ ?/', '$1', array_pop($tags));
    foreach ($tags as $tag) {
        $tag = str_replace('[', '', $tag);
        $item->{$tagLabels[$tag]} = TRUE;
    }
    if (strlen($item->summary) === 0) $item->summary = $tag;
}
function deleteEvents($db, $items, $kind) {
    foreach ($items as $item) {
        $stm = $db->prepare("DELETE FROM `events` WHERE `id` = :id AND `type` = :kind");
        $stm->bindValue(':kind', $kind);
        $stm->bindValue(':id', $item->id);
        $stm->execute();
        $stm->closeCursor();
        $q = "REPLACE INTO `cancelledEvents` SET `id` = :id, `type` = :kind";
        $cancelStm = $db->prepare($q);
        $cancelStm->bindValue(':kind', $kind);
        $cancelStm->bindValue(':id', $item->id);
        $cancelStm->execute();
        $cancelStm->closeCursor();
        echo $kind.' - deleted: '.$item->id.'<br>';
    }
}

function resetEventStore($db) {
    storeParams($db, [
        "lastRetrieved" => date('c', time()+3600),
        "scheduleSyncToken" => NULL,
        "examsSyncToken" => NULL
    ]);
    syncEvents();
}
function parseDate($rawDateStr) : \DateTime {
    $dateStr = explode('.', $rawDateStr)[0];
    $f = 'Y-m-d\TH:i:s';
    $date = DateTime::createFromFormat($f, $dateStr, $TIMEZONE);
    return $date;
}
function getEvents(\DateTime $timeMin, \DateTime $timeMax) {
    $db = setupDB();
    $minT = $timeMin->getTimestamp();
    $maxT = $timeMax->getTimestamp();
    $q = 'select `json` from `events` where `type` = :kind and ((`start` between :min and :max) or (`end` between :min and :max))';
    $stm = $db->prepare($q);
    $stm->bindValue(':min', $minT);
    $stm->bindValue(':max', $maxT);
    return prepareEventsFromDB($stm);
}

function prepareEventsFromDB($stm) {
    $stm->bindValue(':kind', "schedule");
    $stm->execute();
    $res = [
        "schedule"=>[],
        "exams"=>[]
    ];
    while ($r=$stm->fetch()) {
        array_push($res['schedule'], 
                json_decode($r["json"])
                );
    }
    $stm->closeCursor();
    $stm->bindValue(':kind', "exams");
    $stm->execute();
    while ($r=$stm->fetch()) {
        array_push($res['exams'], 
                json_decode($r["json"])
                );
    }
    return $res;
}

function getCancelled($db, $lastSynced)  {
    $q = 'select `id` from `cancelledEvents` where `lastSynced` > :lastSynced and `type` = :kind';
    $stm = $db->prepare($q);
    $stm->bindValue(':lastSynced', $lastSynced);
    $res = [
        "schedule"=>[],
        "exams"=>[]
    ];

    $stm->bindValue(':kind', "schedule");
    $stm->execute();
    while ($r=$stm->fetch()) {
        array_push($res['schedule'], 
                $r["id"]
                );
    }
    $stm->closeCursor();

    $stm->bindValue(':kind', "exams");
    $stm->execute();
    while ($r=$stm->fetch()) {
        array_push($res['exams'], 
                $r["id"]
                );
    }
    $stm->closeCursor();

    return $res;
}

function getSynced(\DateTime $lastSynced) {
    $db = setupDB();
    $lastSynced->setTimezone(new DateTimeZone('-02:00'));
    $minT = $lastSynced->format('Y-m-d H:i:s');
    $stm = $db->prepare('select `json` from `events` where `lastSynced` > :lastSynced and `type` = :kind');
    $stm->bindValue(':lastSynced', $minT);
    $modified = prepareEventsFromDB($stm);
    $cancelled = getCancelled($db, $minT);
    $modified["cancelled"] = $cancelled;
    return $modified;
}
function changeNotify(\PDO $db, $title, $desc) {
    $stm = $db->prepare('select * from `webpush` where `modifyNotifications` = 1');
    $stm->execute();
    while ($row = $stm->fetch()) {
        sendMessage([
            'token' => $row['token'],
            'data' => [
                'shouldUpdate' =>  TRUE,
                'title'        =>  $title,
                'desc'         =>  $desc
            ]
        ]);
    }
}

if (filter_has_var(INPUT_GET, 'sync')) {
    $res = NULL;
    if (filter_has_var(INPUT_POST, 'resource')) {
        $res = json_decode(filter_input(INPUT_POST, 'resource'));
    }
    syncEvents($res);
} else if(filter_has_var(INPUT_GET, 'get')) {
    $timeMin = parseDate(filter_input(INPUT_GET, 'timeMin'));
    $timeMax = parseDate(filter_input(INPUT_GET, 'timeMax'));
    header("content-type: application/json; encoding=utf-8");
    $events = getEvents($timeMin, $timeMax);
    echo json_encode($events);
} else if(filter_has_var(INPUT_GET, 'getSynced')) {
    $lastSynced = parseDate(filter_input(INPUT_GET, 'lastSynced'));
    $toSync = getSynced($lastSynced);
    header("content-type: application/json; encoding=utf-8");
    echo json_encode($toSync);
}
