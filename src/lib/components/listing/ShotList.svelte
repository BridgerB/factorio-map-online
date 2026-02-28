<script lang="ts">
	import type { ShotsJSON } from '$lib/types/mapshot.js';
	import SaveGroup from './SaveGroup.svelte';

	let { shots }: { shots: ShotsJSON } = $props();
</script>

<div class="shot-list">
	{#if shots.all.length === 0}
		<p class="empty">No mapshots found. Render a map to get started.</p>
	{:else}
		{#each shots.all as save (save.savename)}
			<SaveGroup {save} />
		{/each}
	{/if}
</div>

<style>
	.shot-list {
		max-width: 600px;
	}
	.empty {
		color: #999;
	}
</style>
