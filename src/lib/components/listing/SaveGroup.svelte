<script lang="ts">
	import { resolve } from '$app/paths';
	import type { ShotsJSONSave } from '$lib/types/mapshot.js';
	import TicksDisplay from './TicksDisplay.svelte';

	let { save }: { save: ShotsJSONSave } = $props();
</script>

<div class="save-group">
	<h3>{save.savename}</h3>
	<ul>
		{#each save.versions as version, i (version.encoded_path)}
			<li>
				<a href="{resolve('/map')}?path={version.encoded_path}">
					{#if i === 0}
						<strong>Latest</strong>
					{:else}
						Version {save.versions.length - i}
					{/if}
				</a>
				<span class="ticks">
					(<TicksDisplay ticks={version.ticks_played} />)
				</span>
			</li>
		{/each}
	</ul>
</div>

<style>
	.save-group {
		margin-bottom: 1.5rem;
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.1rem;
	}
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	li {
		padding: 0.25rem 0;
	}
	a {
		color: #4fc3f7;
		text-decoration: none;
	}
	a:hover {
		text-decoration: underline;
	}
	.ticks {
		color: #999;
		font-size: 0.9rem;
	}
</style>
