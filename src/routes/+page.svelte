<script lang="ts">
	import { resolve } from '$app/paths';
	import ShotList from '$lib/components/listing/ShotList.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Factorio Map Online</title>
</svelte:head>

<div class="container">
	<header>
		<h1>Factorio Map Online</h1>
		<nav>
			<a href={resolve('/render')}>Render New Map</a>
		</nav>
	</header>

	<main>
		<ShotList shots={data.shots} />
	</main>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 800px;
		margin: 0 auto;
		color: #e0e0e0;
		font-family: system-ui, sans-serif;
	}
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		border-bottom: 1px solid #333;
		padding-bottom: 1rem;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	nav a {
		color: #4fc3f7;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border: 1px solid #4fc3f7;
		border-radius: 4px;
	}
	nav a:hover {
		background: #4fc3f722;
	}
</style>
