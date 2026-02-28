type TileKey = string;
type LoadCallback = () => void;

function key(zoom: number, x: number, y: number): TileKey {
	return `${zoom}/${x}/${y}`;
}

export class TileCache {
	private cache = new Map<TileKey, HTMLImageElement>();
	private loading = new Set<TileKey>();
	private failed = new Set<TileKey>();
	private accessOrder: TileKey[] = [];
	private maxSize: number;
	private onLoad: LoadCallback;

	constructor(onLoad: LoadCallback, maxSize = 512) {
		this.maxSize = maxSize;
		this.onLoad = onLoad;
	}

	get(zoom: number, x: number, y: number): HTMLImageElement | null {
		const k = key(zoom, x, y);
		const img = this.cache.get(k);
		if (img) {
			// Move to end of access order (most recently used)
			const idx = this.accessOrder.indexOf(k);
			if (idx >= 0) this.accessOrder.splice(idx, 1);
			this.accessOrder.push(k);
			return img;
		}
		return null;
	}

	hasFailed(zoom: number, x: number, y: number): boolean {
		return this.failed.has(key(zoom, x, y));
	}

	load(basePath: string, filePrefix: string, zoom: number, x: number, y: number): void {
		const k = key(zoom, x, y);
		if (this.cache.has(k) || this.loading.has(k) || this.failed.has(k)) return;

		this.loading.add(k);
		const img = new Image();

		img.onload = () => {
			this.loading.delete(k);
			this.cache.set(k, img);
			this.accessOrder.push(k);
			this.evict();
			this.onLoad();
		};

		img.onerror = () => {
			this.loading.delete(k);
			this.failed.add(k);
			// Don't call onLoad for failures — the renderer will try fallback
			this.onLoad();
		};

		img.src = `${basePath}${filePrefix}${zoom}/tile_${x}_${y}.jpg`;
	}

	private evict(): void {
		while (this.cache.size > this.maxSize && this.accessOrder.length > 0) {
			const oldest = this.accessOrder.shift()!;
			this.cache.delete(oldest);
		}
	}

	clear(): void {
		this.cache.clear();
		this.loading.clear();
		this.failed.clear();
		this.accessOrder = [];
	}
}
