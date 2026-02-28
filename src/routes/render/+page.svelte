<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let saveName = $state(data.saves?.[0] ?? '');
	let area = $state('player');
	let tilemin = $state(64);
	let tilemax = $state(1024);
	let resolution = $state(1024);
	let jpgquality = $state(75);
	let surface = $state('_all_');

	const POLL_INTERVAL = 2000;

	let submitting = $state(false);
	let jobId = $state<string | null>(null);
	let jobStatus = $state<string>('');
	let error = $state<string>('');

	async function submit() {
		submitting = true;
		error = '';

		try {
			const res = await fetch('/api/render', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					saveName,
					area,
					tilemin,
					tilemax,
					resolution,
					jpgquality,
					surface
				})
			});

			if (!res.ok) {
				error = `Failed to start render: ${res.statusText}`;
				submitting = false;
				return;
			}

			const data = await res.json();
			jobId = data.jobId;
			pollJob();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			submitting = false;
		}
	}

	async function pollJob() {
		if (!jobId) return;

		try {
			const res = await fetch(`/api/render/${jobId}`);
			const job = await res.json();
			jobStatus = job.status;

			if (job.status === 'completed') {
				submitting = false;
				goto(resolve('/'));
			} else if (job.status === 'failed') {
				error = job.error || 'Render failed';
				submitting = false;
			} else {
				setTimeout(pollJob, POLL_INTERVAL);
			}
		} catch {
			setTimeout(pollJob, POLL_INTERVAL);
		}
	}
</script>

<svelte:head>
	<title>Render Map - Factorio Map Online</title>
</svelte:head>

<div class="container">
	<header>
		<h1>Render Map</h1>
		<a href={resolve('/')}>Back to listing</a>
	</header>

	<form
		onsubmit={(e) => {
			e.preventDefault();
			submit();
		}}
	>
		<label>
			<span>Save File</span>
			<select bind:value={saveName}>
				{#each data.saves as save (save)}
					<option value={save}>{save}</option>
				{/each}
			</select>
		</label>

		<label>
			<span>Area</span>
			<select bind:value={area}>
				<option value="player">Player chunks</option>
				<option value="all">All chunks</option>
				<option value="entities">Entity chunks</option>
			</select>
		</label>

		<label>
			<span>Min tile size</span>
			<input type="number" bind:value={tilemin} min={16} max={1024} step={16} />
		</label>

		<label>
			<span>Max tile size</span>
			<input type="number" bind:value={tilemax} min={64} max={4096} step={64} />
		</label>

		<label>
			<span>Resolution (px)</span>
			<input type="number" bind:value={resolution} min={256} max={4096} step={256} />
		</label>

		<label>
			<span>JPG Quality</span>
			<input type="number" bind:value={jpgquality} min={1} max={100} />
		</label>

		<label>
			<span>Surface</span>
			<input type="text" bind:value={surface} placeholder="_all_" />
		</label>

		<button type="submit" disabled={submitting || !saveName}>
			{#if submitting}
				Rendering... ({jobStatus || 'starting'})
			{:else}
				Start Render
			{/if}
		</button>

		{#if error}
			<p class="error">{error}</p>
		{/if}
	</form>
</div>

<style>
	.container {
		padding: 2rem;
		max-width: 500px;
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
	header a {
		color: #4fc3f7;
		text-decoration: none;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	label span {
		font-size: 0.85rem;
		color: #999;
	}
	input,
	select {
		padding: 0.5rem;
		background: #2a2a3e;
		border: 1px solid #444;
		color: #e0e0e0;
		border-radius: 4px;
		font-size: 1rem;
	}
	button {
		padding: 0.75rem;
		background: #4fc3f7;
		color: #000;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		font-weight: 600;
	}
	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.error {
		color: #ff5252;
		margin: 0;
	}
</style>
