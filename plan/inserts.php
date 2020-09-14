<?php 
function startModal($title, $class, $opts) { 
    if (!isset($class)) {
        $class = '';
    }
    if (!isset($opts)) {
        $opts = [
            'bodyClass' => '',
            'center' => true
        ];
    }
?>
<div class="modal <?php echo $class; ?>" tabindex="-1" role="dialog">
    <div class="modal-dialog <?php echo $opts['center'] ? 'modal-dialog-centered':''; ?>" role="document">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title"><?php echo $title; ?></h5>
          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div class="modal-body <?php echo $opts['bodyClass']; ?>">   
<?php } 
function endModal() { ?>
      </div>
    </div>
  </div>
</div>
<?php
}

function getOption(array $array) {
    $result = $array[0];
    $newArray = array_slice($array, 1);
    if ($newArray) {
        $newArray[0] = $result[$newArray[0]];
        return getOption($newArray);
    } else {
        return $result;
    }
}
function settingsCheckbox($opts) { 
    $name = getOption([$opts, 'name']);
    $beta = getOption([$opts,'beta']);
    ?>
<div class="form-row <?php echo getOption([$opts,'row','classes']); ?>">
        <div class="custom-control custom-switch">
            <input id="<?php echo $name; ?>" name="<?php echo $name; ?>" type="checkbox" 
                <?php echo getOption([$opts, 'input', 'attributes']); ?> 
            class="custom-control-input <?php echo getOption([$opts,'input','classes']); ?>">
            <label for="<?php echo $name; ?>" class="custom-control-label pl-2">
                <span class="<?php 
                    echo getOption([$opts,'description','classes']);
                    if ($beta) {
                        echo ' beta';
                    }
                ?>"
                <?php if ($beta) { ?> title="Ta opcja na razie pozostaje w wersji eksperymentalnej"<?php } ?> >
                    <?php echo getOption([$opts,'description','text']); ?>
                </span>
            </label>
        </div>
    </div>
<?php }