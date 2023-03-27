<div class="flex-row-centered">

<style>
#mdinclude<bottom-bar.css>
</style>

<div id = "user-input" style="width:50%; margin: 0;">
<form>
Command drone <input id="input-command" type="text"></input>
</form>
</div>

<div class="flex-row-centered" style="width:50%; margin-top: 15px;">
      <div>
            <p id=toggle-cam>Toggle Camera Mode</p>
            <input type="checkbox" id="switch"
                  class="checkbox" />
            <label for="switch" class="toggle"></label>
      </div>
      <button id="button">Emergency Stop</button>
</div>

<script type="module" src="../components/bottom-bar/bottom-bar.js">
</script>

</div>
