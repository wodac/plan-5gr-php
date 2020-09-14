<?php
$lastOfficialUpdate = '17.02.2020';
if ($_SERVER['HTTP_HOST'] === "www.5grwum.ga") {
	header("Location: https://5grwum.ga");
	die();
}

$firebase = "https://www.gstatic.com/firebasejs/6.6.2/firebase-app.js";
$firebaseCM = "https://www.gstatic.com/firebasejs/6.6.1/firebase-messaging.js";
include "inserts.php";
$icalUrl = 'https://5grwum.ga/plan.ics';
$googleUrl = 'https://calendar.google.com/calendar/render?cid=mjqvrp5umi78kgs1u289huc300%40group.calendar.google.com';
$examsUrl = 'https://calendar.google.com/calendar/render?cid=6u32odsldblequ2pinocjvq9mg%40group.calendar.google.com';
$scripts = [
    '/plan/libs/all.js',
    '/plan/js/gCal.js',
    "/plan/templates/t.js",
    '/plan/js/eventInfo.js',
    '/plan/libs/sammy.min.js',
    '/plan/js/router.js',
    '/plan/js/settings.js',
    '/plan/js/app.js'
];
if ($_COOKIE['withFireBase']=="true") {
    //array_push($scripts, $firebase);
    //array_push($scripts, $firebaseCM);
    array_push($scripts, '/plan/js/useFireBase.js');
}
if ($_COOKIE['withPWA']=="true") {
    array_push($scripts, '/plan/js/initPWA.js');
}
$styles = [
    '/plan/libs/all.css',
    '/plan/css/style.css'
];
?>
<!doctype html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Plan zajęć lato 2020</title>
        <?php if ($_COOKIE['withPWA']=="true") { ?>
        <link rel="manifest" href="/plan/manifest.json">
        <?php } ?>
        <meta name="theme-color" content="#343a40">
        <link rel="icon" href="/plan/img/icon-192.png">
        <script src="/plan/js/iePolyfill.js"></script>
        <link href='https://use.fontawesome.com/releases/v5.0.6/css/all.css' rel='stylesheet'>
        <?php foreach ($styles as $style) { ?>
            <link rel="stylesheet" href="<?php echo $style; ?>">
        <?php } ?>
    </head>
    <body>
        <nav class="bg-dark nav navbar navbar-dark navbar-expand">
            <a class="nav-item navbar-brand" href="/plan/">Plan zajęć</a>
            <div class="ml-auto mr-0">
                <ul class="navbar-nav">
                    <li class="nav-item sync-link d-none">
                        <a class="fa fa-sync nav-link" href="/plan/sync" data-toggle="tooltip" title="Synchronizuj wydarzenia"></a>
                    </li>
                    <li class="nav-item">
                        <a class="fa fa-info-circle nav-link" data-toggle="tooltip" href="/plan/dialog/info" title="Informacje"></a>
                    </li>
                    <li class="nav-item">
                        <a class="fa fa-cog nav-link" href="/plan/dialog/settings" data-toggle="tooltip" title="Ustawienia"></a>
                    </li>
                </ul>
            </div>          
        </nav>
        
        <div class="main-container">
            <div id="calendar"></div>
        
            <div class="loading-container d-none">
                <div class="spinner-grow"></div>
            </div>        
        </div>
        <?php
        startModal("Dodaj plan do swojego kalendarza", "addScheduleDialog", [
            'bodyClass' => 'p-0',
            'center' => true
        ]);
        ?> 
        <ul class="nav nav-tabs pt-2 bg-light" role="tablist">
            <li class="ml-2 nav-item">
                <a class="nav-link active" id="google-calendar-open" data-toggle="tab" href="#google-calendar-tab" role="tab" aria-controls="google-calendar-tab" aria-selected="true">Kalendarz Google</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" id="other-calendars-open" data-toggle="tab" href="#other-calendars-tab" role="tab" aria-controls="other-calendars-tab" aria-selected="false">Inne kalendarze</a>
            </li>
        </ul>
        <div class="p-4 tab-content">
            <div class="tab-pane fade active show" id="google-calendar-tab" role="tabpanel" aria-labelledby="google-calendar-open">
                <div class="container" style="text-align: center;">
                    <div class="row">
                        <div class="col-12">
                            <a class="btn btn-primary m-auto" href="<?php echo $googleUrl; ?>">Dodaj plan do swojego kalendarza Google</a>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12 p-3">
                            <span>oraz</span>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-12">
                            <a class="btn btn-secondary m-auto" href="<?php echo $examsUrl; ?>">Dodaj egzaminy do swojego kalendarza Google</a>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container fade tab-pane" id="other-calendars-tab" role="tabpanel" aria-labelledby="other-calendars-open">
                <div class="form-group form-row">
                    <label class="col-4" for="addLink">Skopiuj ten link:</label>
                    <div class="col-8">
                        <div class="input-group">
                            <input type="text" value="https://5grwum.ga/plan.ics" class="form-control" id="addLink">
                            <div class="copy input-group-append" title="Kliknij, aby skopiować">
                                <span class="fa fa-copy input-group-text"></span>
                            </div>                    
                        </div>
                    </div>                            
                </div>
                <div class="row"><span class="col">a następnie:</span></div>
                <div class="row">
                    <div class="col">
                        <ul>
                            <li>
                                <a target="_blank" href="https://support.apple.com/pl-pl/HT202361">dodaj kalendarz do iCloud</a>
                            </li>
                            <li>
                                <a target="_blank" href="https://support.office.com/pl-pl/article/importowanie-lub-subskrybowanie-kalendarza-w-us%C5%82udze-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c">dodaj kalendarz do usługi Outlook</a>
                                <span> (sekcja <i>Subskrybowanie kalendarza</i>)</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
<?php endModal(); ?>
        
        <?php
        startModal("Informacje", "info", [
            'bodyClass' => 'container',
            'center' => true
        ]); ?>
        <div class="row mb-2">
            <div class="col-12">
                <span class="mt-auto">Ostatnia <u>oficjalna</u> aktualizacja planu:</span>
                <span id="lastUpdated" class="float-right text-muted"><?php
                    echo $lastOfficialUpdate;
                ?></span>
            </div>
            <div class="col-2 d-none">
                <a class="btn btn-light rounded-circle" style="width: 2.6rem;height: 2.6rem;line-height: 1.7;">
                    <span class="fa fa-sync"></span>
                </a>
            </div>
        </div>
        <div class="row mb-2">
            <div class="col-12">
                <span class="mt-auto">Ostatnia aktualizacja planu:</span>
                <span id="lastUpdated" class="float-right text-muted"><?php
//                    $db = setupDB();
//                    $s = $db->prepare("select `value` from `syncData` where name='lastRetrieved'");
//                    $s->execute();
//                    $lastRetrieved = $s->fetch()['value'];
//                    $s->closeCursor();
//                    $lastRetrieved = getParams($db)['lastRetrieved'];
//                    echo $lastRetrieved;
                    //echo (new DateTime($lastRetrieved))->format('d.m.Y \o H:i:s');
                ?></span>
            </div>
        </div>
        <?php
        endModal();
        startModal("Ustawienia", "settings", [
            'bodyClass' => 'container',
            'center' => true
        ]); ?>
        <form id="settingsForm" method="post"> <?php 
            settingsCheckbox([
                'name'=>'hideWeekends',
                'input'=>[
                    'attributes'=>'checked' 
                ],
                'description'=>[
                    'text'=>'Ukryj weekendy'
                ],
                'row'=>[
                    'classes'=>'pb-3 pl-2'
                ]
            ]);
            settingsCheckbox([
                'name'=>'showLectures',
                'input'=>[
                    'attributes'=>'checked' 
                ],
                'description'=>[
                    'text'=>'Pokazuj wykłady'
                ],
                'row'=>[
                    'classes'=>'pb-3 pl-2'
                ]
            ]); 
            settingsCheckbox([
                'name'=>'usePWA',
                'input'=>[],
                'description'=>[
                    'text'=>'Używaj offline'
                ],
                'beta'=>TRUE,
                'row'=>[
                    'classes'=>'pb-3 pl-2'
                ]
            ]); 
            settingsCheckbox([
                'name'=>'showNotifications',
                'input'=>[
                    'attributes'=>'data-toggle="collapse" data-target="#collapseNotifications"' 
                ],
                'description'=>[
                    'text'=>'Pokazuj powiadomienia'
                ],
                'beta'=>TRUE,
                'row'=>[
                    'classes'=>'pl-2'
                ]
            ]); ?>
            <div class="collapse my-2" id="collapseNotifications">
                <div class="card card-body mt-3">
                    <!--<div class="form-row pl-2">
                        <label for="timeForNotification" class="col-8 col-md-9">Godzina powiadomienia:</label>
                        <input type="time" value="06:00" id="timeForNotification" name="timeForNotification" class="col-4 col-md-3 form-control">
                    </div>-->
                    <?php 
                    settingsCheckbox([
                        'name'=>'modifyNotifications',
                        'input'=>[
                            'attributes'=>'' 
                        ],
                        'description'=>[
                            'text'=>'Powiadamiaj o zmianach planu'
                        ],
                        'beta'=>TRUE,
                        'row'=>[
                            'classes'=>'pt-3 pl-2'
                        ]
                    ]);
                    ?>
                </div>
            </div>
            <div class="form-row p-1">                
                <span class="fade float-right ml-auto mr-4 my-2 saved text-muted">Zapisano</span>
                <input type="submit" value="Zapisz" class="btn btn-primary">
            </div>
        </form>
        <?php endModal(); ?>
<!-- 
        <script>
        var preloadedEvents = {};
        </script> -->
        <?php foreach ($scripts as $script) { ?>
            <script src="<?php echo $script; ?>"></script>
        <?php } ?>
    </body>
</html>
<?php
