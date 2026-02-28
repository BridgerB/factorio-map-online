<script lang="ts">
	import { screenToWorld } from './viewport.js';

	let {
		zoom = $bindable(),
		zoomMin,
		zoomMax,
		centerX,
		centerY,
		tilemax,
		renderSize,
		width,
		height,
		mouseX = 0,
		mouseY = 0
	}: {
		zoom: number;
		zoomMin: number;
		zoomMax: number;
		centerX: number;
		centerY: number;
		tilemax: number;
		renderSize: number;
		width: number;
		height: number;
		mouseX?: number;
		mouseY?: number;
	} = $props();

	let worldCoords = $derived(
		screenToWorld(
			mouseX,
			mouseY,
			{ x: centerX, y: centerY },
			width,
			height,
			zoom,
			tilemax,
			renderSize
		)
	);
</script>

<div class="controls">
	<div class="zoom-controls">
		<button onclick={() => (zoom = Math.min(zoomMax + 4, zoom + 1))}>+</button>
		<span class="zoom-level">{Math.floor(zoom)}</span>
		<button onclick={() => (zoom = Math.max(zoomMin - 4, zoom - 1))}>-</button>
	</div>
	<div class="coords">
		{worldCoords.wx.toFixed(0)}, {worldCoords.wy.toFixed(0)}
	</div>
</div>

<style>
	.controls {
		position: absolute;
		top: 10px;
		right: 10px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		z-index: 10;
	}
	.zoom-controls {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: rgba(0, 0, 0, 0.7);
		border-radius: 4px;
		overflow: hidden;
	}
	button {
		width: 36px;
		height: 36px;
		border: none;
		background: transparent;
		color: #fff;
		font-size: 18px;
		cursor: pointer;
	}
	button:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	.zoom-level {
		color: #fff;
		font-size: 12px;
		padding: 4px;
	}
	.coords {
		background: rgba(0, 0, 0, 0.7);
		color: #ccc;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 11px;
		font-family: monospace;
		text-align: center;
	}
</style>
