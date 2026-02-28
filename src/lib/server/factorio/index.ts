import { spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { FactorioSettings } from './settings.js';
import { loadModList, writeModList } from './mod-list.js';

export { resolveSettings, type FactorioSettings } from './settings.js';
export { enableMod } from './mod-list.js';

const MODS_DIR = 'mods';
const SAVES_DIR = 'saves';

const extractModName = (entry: string) => {
	const idx = entry.lastIndexOf('_');
	return idx >= 0 ? entry.substring(0, idx) : entry;
};

export function modsDir(settings: FactorioSettings): string {
	return path.join(settings.dataDir, MODS_DIR);
}

export function findSaveFile(settings: FactorioSettings, name: string): string {
	const candidates = [
		name,
		name + '.zip',
		path.join(settings.dataDir, SAVES_DIR, name + '.zip'),
		path.join(settings.dataDir, SAVES_DIR, name)
	];

	for (const c of candidates) {
		try {
			fs.statSync(c);
			return c;
		} catch {
			// not found, try next
		}
	}

	throw new Error(`Save file not found: ${name}`);
}

export function runFactorio(
	settings: FactorioSettings,
	args: string[],
	signal?: AbortSignal
): Promise<void> {
	return new Promise((resolve, reject) => {
		// On NixOS, the Steam Factorio binary needs steam-run for FHS compatibility.
		// Set SteamAppId to prevent Steam from restarting the process.
		const useWrapper = process.env.FACTORIO_WRAPPER ?? 'steam-run';
		const command = useWrapper ? useWrapper : settings.binary;
		const fullArgs = useWrapper ? [settings.binary, ...args] : args;

		const proc: ChildProcess = spawn(command, fullArgs, {
			stdio: settings.verbose ? 'inherit' : 'ignore',
			env: { ...process.env, SteamAppId: '427520' }
		});

		const onAbort = () => {
			proc.kill('SIGINT');
		};
		signal?.addEventListener('abort', onAbort, { once: true });

		proc.on('error', (err) => {
			signal?.removeEventListener('abort', onAbort);
			reject(err);
		});

		proc.on('close', (code) => {
			signal?.removeEventListener('abort', onAbort);
			if (code === 0 || signal?.aborted) {
				resolve();
			} else {
				reject(new Error(`Factorio exited with code ${code}`));
			}
		});
	});
}

export function copyMods(settings: FactorioSettings, dstMods: string, filterOut: string[]): void {
	const srcMods = modsDir(settings);
	const filtered = new Set(filterOut);
	let foundModList = false;

	fs.mkdirSync(dstMods, { recursive: true });

	const entries = fs.readdirSync(srcMods);
	for (const entry of entries) {
		const src = path.join(srcMods, entry);
		const dst = path.join(dstMods, entry);

		if (filtered.has(extractModName(entry))) {
			continue;
		}

		if (entry === 'mod-list.json') {
			const mlist = loadModList(src);
			mlist.mods = mlist.mods.filter((mod) => !filtered.has(mod.name));
			writeModList(mlist, dst);
			foundModList = true;
			continue;
		}

		// Deep copy
		fs.cpSync(src, dst, { recursive: true, dereference: true });
	}

	if (!foundModList) {
		throw new Error(`mod-list.json not found in ${srcMods}`);
	}
}
