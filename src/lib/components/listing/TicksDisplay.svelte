<script lang="ts">
	const TICKS_PER_SECOND = 60;
	const TICKS_PER_MINUTE = TICKS_PER_SECOND * 60;
	const TICKS_PER_HOUR = TICKS_PER_MINUTE * 60;

	let { ticks }: { ticks: number } = $props();

	let display = $derived.by(() => {
		if (ticks < TICKS_PER_MINUTE) {
			const secs = Math.floor(ticks / TICKS_PER_SECOND);
			return `${secs}s`;
		}
		if (ticks < TICKS_PER_HOUR) {
			const mins = Math.floor(ticks / TICKS_PER_MINUTE);
			return `${mins}m`;
		}
		const hours = Math.floor(ticks / TICKS_PER_HOUR);
		const mins = Math.floor((ticks % TICKS_PER_HOUR) / TICKS_PER_MINUTE);
		return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
	});
</script>

<span title="{ticks} ticks">{display}</span>
