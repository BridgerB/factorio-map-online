export interface ViewportState {
	centerX: number; // world coordinates
	centerY: number;
	zoom: number; // float, floor(zoom) = tile zoom level
}

export interface TileRange {
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

/** Size of a tile in world units at the given zoom level */
export function tileWorldSize(zoom: number, tilemax: number): number {
	return tilemax / 2 ** Math.floor(zoom);
}

/** Size of a tile in screen pixels at the given zoom level */
export function tileScreenSize(zoom: number, renderSize: number): number {
	return renderSize * 2 ** (zoom - Math.floor(zoom));
}

/** Convert world coordinates to tile coordinates */
export function worldToTile(
	worldX: number,
	worldY: number,
	zoom: number,
	tilemax: number
): { tx: number; ty: number } {
	const ws = tileWorldSize(zoom, tilemax);
	return {
		tx: Math.floor(worldX / ws),
		ty: Math.floor(worldY / ws)
	};
}

/** Get the range of visible tiles for the current viewport */
export function visibleTileRange(
	center: { x: number; y: number },
	canvasWidth: number,
	canvasHeight: number,
	zoom: number,
	tilemax: number,
	renderSize: number
): TileRange {
	const ws = tileWorldSize(zoom, tilemax);
	const ss = tileScreenSize(zoom, renderSize);
	const worldPerPixel = ws / ss;

	const halfW = (canvasWidth / 2) * worldPerPixel;
	const halfH = (canvasHeight / 2) * worldPerPixel;

	return {
		minX: Math.floor((center.x - halfW) / ws),
		maxX: Math.floor((center.x + halfW) / ws),
		minY: Math.floor((center.y - halfH) / ws),
		maxY: Math.floor((center.y + halfH) / ws)
	};
}

/** Convert world position to screen position relative to canvas center */
export function worldToScreen(
	worldX: number,
	worldY: number,
	center: { x: number; y: number },
	canvasWidth: number,
	canvasHeight: number,
	zoom: number,
	tilemax: number,
	renderSize: number
): { sx: number; sy: number } {
	const ws = tileWorldSize(zoom, tilemax);
	const ss = tileScreenSize(zoom, renderSize);
	const pixelsPerWorld = ss / ws;

	return {
		sx: (worldX - center.x) * pixelsPerWorld + canvasWidth / 2,
		sy: (worldY - center.y) * pixelsPerWorld + canvasHeight / 2
	};
}

/** Convert screen position to world coordinates */
export function screenToWorld(
	screenX: number,
	screenY: number,
	center: { x: number; y: number },
	canvasWidth: number,
	canvasHeight: number,
	zoom: number,
	tilemax: number,
	renderSize: number
): { wx: number; wy: number } {
	const ws = tileWorldSize(zoom, tilemax);
	const ss = tileScreenSize(zoom, renderSize);
	const worldPerPixel = ws / ss;

	return {
		wx: (screenX - canvasWidth / 2) * worldPerPixel + center.x,
		wy: (screenY - canvasHeight / 2) * worldPerPixel + center.y
	};
}

/** Clamp zoom to valid range */
export function clampZoom(zoom: number, zoomMin: number, zoomMax: number): number {
	return Math.max(zoomMin, Math.min(zoomMax, zoom));
}
