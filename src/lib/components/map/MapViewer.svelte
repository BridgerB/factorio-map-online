<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import type { MapshotJSON, MapshotSurfaceJSON } from '$lib/types/mapshot.js';
	import { parseNumber } from '$lib/types/mapshot.js';
	import TileLayer from './TileLayer.svelte';
	import OverlayLayer from './OverlayLayer.svelte';
	import Controls from './Controls.svelte';
	import SurfaceSelector from './SurfaceSelector.svelte';

	let { mapshot, basePath }: { mapshot: MapshotJSON; basePath: string } = $props();

	let containerEl: HTMLDivElement;
	let width = $state(800);
	let height = $state(600);

	// Viewport state
	let selectedSurface = $state(0);
	let centerX = $state(0);
	let centerY = $state(0);
	let zoom = $state(0);

	// Mouse tracking
	let mouseX = $state(0);
	let mouseY = $state(0);

	// Drag state
	let dragging = $state(false);
	let dragStartX = 0;
	let dragStartY = 0;
	let dragCenterStartX = 0;
	let dragCenterStartY = 0;

	let surface: MapshotSurfaceJSON = $derived(mapshot.surfaces[selectedSurface]);

	// Reset viewport when switching surfaces
	let prevSurface = -1;
	$effect(() => {
		if (selectedSurface !== prevSurface && prevSurface >= 0) {
			const s = mapshot.surfaces[selectedSurface];
			// Center on the surface's world bounds
			centerX = (s.world_min.x + s.world_max.x) / 2;
			centerY = (s.world_min.y + s.world_max.y) / 2;
			zoom = s.zoom_min;
		}
		prevSurface = selectedSurface;
	});

	// Initialize from URL params
	onMount(() => {
		const params = page.url.searchParams;
		centerX = parseNumber(params.get('x'), 0);
		centerY = parseNumber(params.get('y'), 0);
		zoom = parseNumber(params.get('z'), surface.zoom_min);
		const s = parseNumber(params.get('s'), 0);
		if (s >= 0 && s < mapshot.surfaces.length) {
			selectedSurface = s;
		}

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				width = entry.contentRect.width;
				height = entry.contentRect.height;
			}
		});
		observer.observe(containerEl);

		return () => observer.disconnect();
	});

	function updateUrl() {
		const url = new URL(page.url);
		url.searchParams.set('x', centerX.toFixed(1));
		url.searchParams.set('y', centerY.toFixed(1));
		url.searchParams.set('z', zoom.toFixed(1));
		url.searchParams.set('s', String(selectedSurface));
		const pathParam = page.url.searchParams.get('path');
		if (pathParam) url.searchParams.set('path', pathParam);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- URL built from page.url, no base path resolution needed
		replaceState(url, {});
	}

	// Debounced URL update
	let urlUpdateTimer: ReturnType<typeof setTimeout>;
	$effect(() => {
		const _deps = [centerX, centerY, zoom, selectedSurface];
		void _deps;
		clearTimeout(urlUpdateTimer);
		urlUpdateTimer = setTimeout(updateUrl, 200);
	});

	function worldPerPixel(): number {
		const ws = surface.tile_size / 2 ** Math.floor(zoom);
		const ss = surface.render_size * 2 ** (zoom - Math.floor(zoom));
		return ws / ss;
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		const delta = -e.deltaY * 0.002;
		const newZoom = Math.max(surface.zoom_min - 4, Math.min(surface.zoom_max + 4, zoom + delta));

		// Zoom toward mouse: keep the world point under the cursor fixed
		const offsetX = mouseX - width / 2;
		const offsetY = mouseY - height / 2;
		const wppBefore = surface.tile_size / (surface.render_size * 2 ** zoom);
		const wppAfter = surface.tile_size / (surface.render_size * 2 ** newZoom);
		centerX += offsetX * (wppBefore - wppAfter);
		centerY += offsetY * (wppBefore - wppAfter);

		zoom = newZoom;
	}

	function onMouseDown(e: MouseEvent) {
		if (e.button !== 0) return;
		dragging = true;
		dragStartX = e.clientX;
		dragStartY = e.clientY;
		dragCenterStartX = centerX;
		dragCenterStartY = centerY;
	}

	function onMouseMove(e: MouseEvent) {
		const rect = containerEl.getBoundingClientRect();
		mouseX = e.clientX - rect.left;
		mouseY = e.clientY - rect.top;

		if (!dragging) return;
		const dx = e.clientX - dragStartX;
		const dy = e.clientY - dragStartY;
		const wpp = worldPerPixel();
		centerX = dragCenterStartX - dx * wpp;
		centerY = dragCenterStartY - dy * wpp;
	}

	function onMouseUp() {
		dragging = false;
	}

	const touchDistance = (a: Touch, b: Touch) =>
		Math.sqrt((b.clientX - a.clientX) ** 2 + (b.clientY - a.clientY) ** 2);

	let lastTouchDist = 0;

	function onTouchStart(e: TouchEvent) {
		if (e.touches.length === 1) {
			dragging = true;
			dragStartX = e.touches[0].clientX;
			dragStartY = e.touches[0].clientY;
			dragCenterStartX = centerX;
			dragCenterStartY = centerY;
		} else if (e.touches.length === 2) {
			dragging = false;
			lastTouchDist = touchDistance(e.touches[0], e.touches[1]);
		}
	}

	function onTouchMove(e: TouchEvent) {
		e.preventDefault();
		if (e.touches.length === 1 && dragging) {
			const dx = e.touches[0].clientX - dragStartX;
			const dy = e.touches[0].clientY - dragStartY;
			const wpp = worldPerPixel();
			centerX = dragCenterStartX - dx * wpp;
			centerY = dragCenterStartY - dy * wpp;
		} else if (e.touches.length === 2) {
			const dist = touchDistance(e.touches[0], e.touches[1]);
			if (lastTouchDist > 0) {
				const scale = dist / lastTouchDist;
				const delta = Math.log2(scale);
				zoom = Math.max(surface.zoom_min - 4, Math.min(surface.zoom_max + 4, zoom + delta));
			}
			lastTouchDist = dist;
		}
	}

	function onTouchEnd() {
		dragging = false;
		lastTouchDist = 0;
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
	class="map-viewer"
	bind:this={containerEl}
	onwheel={onWheel}
	onmousedown={onMouseDown}
	onmousemove={onMouseMove}
	onmouseup={onMouseUp}
	onmouseleave={onMouseUp}
	ontouchstart={onTouchStart}
	ontouchmove={onTouchMove}
	ontouchend={onTouchEnd}
	role="application"
	tabindex="-1"
>
	{#if surface}
		<TileLayer
			{centerX}
			{centerY}
			{zoom}
			tilemax={surface.tile_size}
			renderSize={surface.render_size}
			zoomMin={surface.zoom_min}
			zoomMax={surface.zoom_max}
			worldMinX={surface.world_min.x}
			worldMinY={surface.world_min.y}
			worldMaxX={surface.world_max.x}
			worldMaxY={surface.world_max.y}
			{basePath}
			filePrefix={surface.file_prefix}
			{width}
			{height}
		/>

		<OverlayLayer
			stations={surface.stations}
			tags={surface.tags}
			players={surface.players}
			{centerX}
			{centerY}
			{zoom}
			zoomMin={surface.zoom_min}
			tilemax={surface.tile_size}
			renderSize={surface.render_size}
			{width}
			{height}
		/>

		<Controls
			bind:zoom
			zoomMin={surface.zoom_min}
			zoomMax={surface.zoom_max}
			{centerX}
			{centerY}
			tilemax={surface.tile_size}
			renderSize={surface.render_size}
			{width}
			{height}
			{mouseX}
			{mouseY}
		/>

		<SurfaceSelector surfaces={mapshot.surfaces} bind:selected={selectedSurface} />
	{/if}
</div>

<style>
	.map-viewer {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: hidden;
		cursor: grab;
		background: #1a1a2e;
		user-select: none;
		touch-action: none;
	}
	.map-viewer:active {
		cursor: grabbing;
	}
</style>
