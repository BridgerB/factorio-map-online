<script lang="ts">
	import type { MapshotSurfaceJSON } from '$lib/types/mapshot.js';

	let {
		surfaces,
		selected = $bindable()
	}: {
		surfaces: MapshotSurfaceJSON[];
		selected: number;
	} = $props();
</script>

{#if surfaces.length > 1}
	<div class="surface-selector">
		{#each surfaces as surface, i (surface.surface_name)}
			<button class:active={selected === i} onclick={() => (selected = i)}>
				{surface.surface_localised_name || surface.surface_name}
				{#if surface.is_planet}
					<span class="badge">planet</span>
				{/if}
				{#if surface.is_space_platform}
					<span class="badge">platform</span>
				{/if}
			</button>
		{/each}
	</div>
{/if}

<style>
	.surface-selector {
		position: absolute;
		top: 10px;
		left: 10px;
		display: flex;
		gap: 4px;
		z-index: 10;
	}
	button {
		background: rgba(0, 0, 0, 0.7);
		color: #ccc;
		border: 1px solid transparent;
		padding: 6px 12px;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
	}
	button:hover {
		background: rgba(0, 0, 0, 0.85);
	}
	button.active {
		border-color: #4fc3f7;
		color: #fff;
	}
	.badge {
		font-size: 10px;
		opacity: 0.6;
		margin-left: 4px;
	}
</style>
