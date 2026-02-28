<script lang="ts">
	import MapViewer from '$lib/components/map/MapViewer.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.mapshot.savename} - Factorio Map</title>
</svelte:head>

<div class="map-page">
	<MapViewer mapshot={data.mapshot} basePath={data.basePath} />
</div>

<style>
	.map-page {
		position: fixed;
		inset: 0;
		background: #1a1a2e;
	}
</style>
