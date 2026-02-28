<script lang="ts">
	import { onMount } from 'svelte';
	import { TileCache } from './TileCache.js';
	import { tileWorldSize } from './viewport.js';

	let {
		centerX,
		centerY,
		zoom,
		tilemax,
		renderSize,
		zoomMin,
		zoomMax,
		worldMinX,
		worldMinY,
		worldMaxX,
		worldMaxY,
		basePath,
		filePrefix,
		width,
		height
	}: {
		centerX: number;
		centerY: number;
		zoom: number;
		tilemax: number;
		renderSize: number;
		zoomMin: number;
		zoomMax: number;
		worldMinX: number;
		worldMinY: number;
		worldMaxX: number;
		worldMaxY: number;
		basePath: string;
		filePrefix: string;
		width: number;
		height: number;
	} = $props();

	let canvas: HTMLCanvasElement;
	let cache: TileCache;
	let animFrameId: number;

	function draw() {
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		canvas.width = width * dpr;
		canvas.height = height * dpr;
		ctx.scale(dpr, dpr);

		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.fillStyle = '#1a1a2e';
		ctx.fillRect(0, 0, width, height);

		const zoomLevel = Math.floor(zoom);
		// Clamp tile-fetch zoom to available data; viewport zoom can exceed this
		const tileZoom = Math.max(zoomMin, Math.min(zoomMax, zoomLevel));
		// World/screen sizes based on the tile data zoom level
		const tileWs = tileWorldSize(tileZoom, tilemax);
		// Scale factor: how much to scale tiles when zoomed past available data
		const extraScale = 2 ** (zoom - tileZoom);
		const ss = renderSize * extraScale;
		const center = { x: centerX, y: centerY };
		const pixelsPerWorld = ss / tileWs;

		// Compute visible tile range at the tile data zoom level
		const halfW = width / 2 / pixelsPerWorld;
		const halfH = height / 2 / pixelsPerWorld;

		// Clamp to world bounds so we don't draw tiles outside the map
		const worldMinTX = Math.floor(worldMinX / tileWs);
		const worldMaxTX = Math.floor(worldMaxX / tileWs);
		const worldMinTY = Math.floor(worldMinY / tileWs);
		const worldMaxTY = Math.floor(worldMaxY / tileWs);

		const range = {
			minX: Math.max(worldMinTX, Math.floor((center.x - halfW) / tileWs)),
			maxX: Math.min(worldMaxTX, Math.floor((center.x + halfW) / tileWs)),
			minY: Math.max(worldMinTY, Math.floor((center.y - halfH) / tileWs)),
			maxY: Math.min(worldMaxTY, Math.floor((center.y + halfH) / tileWs))
		};

		// Add 1 tile padding
		for (let ty = range.minY - 1; ty <= range.maxY + 1; ty++) {
			for (let tx = range.minX - 1; tx <= range.maxX + 1; tx++) {
				const tileWorldX = tx * tileWs;
				const tileWorldY = ty * tileWs;

				const sx = (tileWorldX - center.x) * pixelsPerWorld + width / 2;
				const sy = (tileWorldY - center.y) * pixelsPerWorld + height / 2;

				// Try to get tile at the best available zoom level
				let img = cache.get(tileZoom, tx, ty);

				if (!img) {
					// Start loading
					cache.load(basePath, filePrefix, tileZoom, tx, ty);

					// Try fallback: draw parent tile (zoom-1, scaled up)
					if (tileZoom > zoomMin) {
						const parentTx = Math.floor(tx / 2);
						const parentTy = Math.floor(ty / 2);
						const parentImg = cache.get(tileZoom - 1, parentTx, parentTy);

						if (parentImg) {
							// Draw the relevant quadrant of the parent tile
							const subX = tx - parentTx * 2;
							const subY = ty - parentTy * 2;
							const srcSize = renderSize / 2;

							ctx.drawImage(
								parentImg,
								subX * srcSize,
								subY * srcSize,
								srcSize,
								srcSize,
								sx,
								sy,
								ss + 1,
								ss + 1
							);
						}
					}
					continue;
				}

				// +1 to avoid seam gaps between tiles
				ctx.drawImage(img, sx, sy, ss + 1, ss + 1);
			}
		}
	}

	function requestDraw() {
		if (animFrameId) cancelAnimationFrame(animFrameId);
		animFrameId = requestAnimationFrame(draw);
	}

	onMount(() => {
		cache = new TileCache(requestDraw);
		requestDraw();

		return () => {
			if (animFrameId) cancelAnimationFrame(animFrameId);
			cache.clear();
		};
	});

	// Clear cache when the tile source changes (e.g. surface switch)
	let prevFilePrefix = $state('');
	$effect(() => {
		if (cache && filePrefix !== prevFilePrefix) {
			cache.clear();
			prevFilePrefix = filePrefix;
		}
	});

	// Redraw when props change
	$effect(() => {
		// Track reactive deps
		const _deps = [centerX, centerY, zoom, width, height, basePath, filePrefix];
		void _deps;
		if (cache) requestDraw();
	});
</script>

<canvas bind:this={canvas} class="tile-canvas" style="width: {width}px; height: {height}px;"
></canvas>

<style>
	.tile-canvas {
		display: block;
		image-rendering: auto;
	}
</style>
