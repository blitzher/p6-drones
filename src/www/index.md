<head>

<style>
#mdinclude<style.css>
</style>

<!-- Include JMuxer and jsQR -->
<script type="text/javascript" src="libs/jmuxer.min.js"></script>
<script type="text/javascript" src="libs/cv.js"></script>
<script type="text/javascript" src="libs/aruco.js"></script>

<script type="module" src="libs/three.min.js"></script>
<script type="module" src="libs/glfloader.js"></script>

<script type="text/javascript" src="scripts/utilities.js"></script>
<script type="module" src="scripts/main.js"></script>

</head>
<div>

# Hello there

This is my _very cool_ website, very nice

<div id="canvases">
<div>
	<video id="camera" class="quad-size"autoplay muted></video>
	<video id="camera1" class="quad-size"autoplay muted></video>
	<video id="camera2" class="quad-size"autoplay muted></video>
	<video id="camera3" class="quad-size"autoplay muted></video>
	<canvas id="vcanvas" class="quad-size"></canvas>
	<canvas id="vcanvas1" class="quad-size"></canvas>
	<canvas id="vcanvas2" class="quad-size"></canvas>
	<canvas id="vcanvas3" class="quad-size"></canvas>
</div>
<div><canvas id="map"></canvas></div>
</div>
<div id = "user-input">
<form>
Command drone <input id="input-command" type="text"></input>
</form>
<div style="grid-column:2; display: flex; flex-direction: row;">
<div>
<p id=toggle-cam>Toggle Camera Mode</p>
<input type="checkbox" id="switch"
      class="checkbox" />
<label for="switch" class="toggle"></label>
</div>
<button id="button" style="margin-left:auto;">Emergency Stop</button>
</div>
</div>
</div>

<div class="hovering" id="stateinfo-window">
<div style="display:flex; width:100%;">
<div class="move-hover">+++State+++</div>
<div class="hide-show" style="text-align: right; width: fit-content" id="hide-show-info">&darr;</div> 
</div>
<span id="stateinfo-data">No state data</span>
</div>
