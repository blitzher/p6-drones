<head>

<style>
#mdinclude<style.css>
</style>

<!-- Include JMuxer and jsQR -->
<script type="text/javascript" src="libs/jmuxer.min.js"></script>
<script type="text/javascript" src="libs/cv.js"></script>
<script type="text/javascript" src="libs/aruco.js"></script>

<script type="text/javascript" src="scripts/utilities.js"></script>
<script type="module" src="scripts/main.js"></script>

</head>
<div>

# Hello there

This is my _very cool_ website, very nice

<div id=canvases>
<div>
	<video id="camera" autoplay muted></video>
	<canvas id="vcanvas"></canvas>
</div>
<div><canvas id="map"></canvas></div>
</div>

<form>
Command drone <input id="input-command" type="text"></input>
</form>

</div>

<div class="hovering" id="stateinfo-window">
<div style="display:flex; width:100%;">
<div class="move-hover">++++++++</div>
<div class="hide-show" style="text-align: right; width: fit-content" id="hide-show-info">&darr;</div> 
</div>
<span id="stateinfo-data">No state data</span>
</div>
