<script lang="ts">
	import type { FactorioStation, FactorioTag, FactorioPlayer } from '$lib/types/mapshot.js';
	import { isIterable } from '$lib/types/mapshot.js';
	import { worldToScreen } from './viewport.js';

	let {
		stations = [],
		tags = [],
		players = [],
		centerX,
		centerY,
		zoom,
		zoomMin = 0,
		tilemax,
		renderSize,
		width,
		height
	}: {
		stations?: FactorioStation[] | Record<string, never>;
		tags?: FactorioTag[] | Record<string, never>;
		players?: FactorioPlayer[] | Record<string, never>;
		centerX: number;
		centerY: number;
		zoom: number;
		zoomMin?: number;
		tilemax: number;
		renderSize: number;
		width: number;
		height: number;
	} = $props();

	const center = $derived({ x: centerX, y: centerY });

	function toScreen(worldX: number, worldY: number) {
		return worldToScreen(worldX, worldY, center, width, height, zoom, tilemax, renderSize);
	}

	function inView(sx: number, sy: number, margin = 50): boolean {
		return sx > -margin && sx < width + margin && sy > -margin && sy < height + margin;
	}

	let stationList = $derived(isIterable(stations) ? [...stations] : []);
	let tagList = $derived(isIterable(tags) ? [...tags] : []);
	let playerList = $derived(isIterable(players) ? [...players] : []);

	// Hide markers when zoomed out to avoid visual clutter
	let showStations = $derived(zoom > zoomMin + 1);
	let showTags = $derived(zoom > zoomMin + 0.5);
</script>

<div class="overlay" style="width: {width}px; height: {height}px;">
	{#if showStations}
		{#each stationList as station, i (i)}
			{@const cx = (station.bounding_box.left_top.x + station.bounding_box.right_bottom.x) / 2}
			{@const cy = (station.bounding_box.left_top.y + station.bounding_box.right_bottom.y) / 2}
			{@const pos = toScreen(cx, cy)}
			{#if inView(pos.sx, pos.sy)}
				<div
					class="marker station"
					style="left: {pos.sx}px; top: {pos.sy}px;"
					title={station.backer_name}
				>
					<span class="label">{station.backer_name}</span>
				</div>
			{/if}
		{/each}
	{/if}

	{#if showTags}
		{#each tagList as tag (tag.tag_number)}
			{@const pos = toScreen(tag.position.x, tag.position.y)}
			{#if inView(pos.sx, pos.sy)}
				<div class="marker tag" style="left: {pos.sx}px; top: {pos.sy}px;" title={tag.text}>
					<span class="label">{tag.text}</span>
				</div>
			{/if}
		{/each}
	{/if}

	{#each playerList as player (player.name)}
		{@const pos = toScreen(player.position.x, player.position.y)}
		{#if inView(pos.sx, pos.sy)}
			<div
				class="marker player"
				style="left: {pos.sx}px; top: {pos.sy}px; --player-color: rgba({Math.round(
					player.color.r * 255
				)}, {Math.round(player.color.g * 255)}, {Math.round(player.color.b * 255)}, {player.color
					.a})"
				title={player.name}
			>
				<span class="dot"></span>
			</div>
		{/if}
	{/each}
</div>

<style>
	.overlay {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		overflow: hidden;
	}
	.marker {
		position: absolute;
		transform: translate(-50%, -50%);
		pointer-events: auto;
		white-space: nowrap;
	}
	.label {
		background: rgba(0, 0, 0, 0.7);
		color: #fff;
		padding: 2px 6px;
		border-radius: 3px;
		font-size: 11px;
	}
	.station .label {
		border-left: 3px solid #f0c040;
	}
	.tag .label {
		border-left: 3px solid #80cbc4;
	}
	.player .dot {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--player-color);
		border: 2px solid #fff;
	}
</style>
