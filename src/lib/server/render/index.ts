import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
	findSaveFile,
	runFactorio,
	copyMods,
	enableMod,
	type FactorioSettings
} from '../factorio/index.js';
import { type RenderParams, writeOverrides, writeMinimalGenerated } from './overrides.js';

export type { RenderParams } from './overrides.js';

const MOD_SOURCE = path.resolve('upstream/mapshot/mod');

const tryUnlink = (filePath: string) => fs.rmSync(filePath, { force: true });

function copyModFiles(dstMapshot: string): void {
	fs.mkdirSync(dstMapshot, { recursive: true });

	const entries = fs.readdirSync(MOD_SOURCE);
	for (const entry of entries) {
		// Skip generated.lua — we write our own minimal version
		if (entry === 'generated.lua') continue;
		// Skip overrides.lua — we write our own
		if (entry === 'overrides.lua') continue;

		const src = path.join(MOD_SOURCE, entry);
		const dst = path.join(dstMapshot, entry);
		fs.cpSync(src, dst, { recursive: true, dereference: true });
	}
}

export async function render(
	settings: FactorioSettings,
	saveName: string,
	params: RenderParams = {}
): Promise<string> {
	const runId = crypto.randomUUID();

	// Extract clean name from path
	const baseName = path.basename(saveName, path.extname(saveName)) || saveName;

	// Use a work directory under dataDir instead of /tmp.
	// steam-run (NixOS FHS wrapper) can't see /tmp but can see $HOME.
	const workBase = path.join(settings.dataDir, 'mapshot-work');
	fs.mkdirSync(workBase, { recursive: true });
	const tmpdir = fs.mkdtempSync(path.join(workBase, 'render-'));

	try {
		// Copy save file
		const srcSave = findSaveFile(settings, saveName);
		const dstSave = path.join(tmpdir, baseName + '.zip');
		fs.cpSync(srcSave, dstSave);

		// Copy mods (excluding mapshot)
		const dstMods = path.join(tmpdir, 'mods');
		copyMods(settings, dstMods, ['mapshot']);

		// Add mapshot mod from upstream submodule
		const dstMapshot = path.join(dstMods, 'mapshot');
		copyModFiles(dstMapshot);
		writeMinimalGenerated(dstMapshot);
		writeOverrides(params, runId, baseName, dstMapshot);
		enableMod(dstMods, 'mapshot');

		const doneFile = path.join(settings.scriptOutput, `mapshot-done-${runId}`);
		tryUnlink(doneFile);

		// Start Factorio (requires full client for take_screenshot).
		// On NixOS, steam-run provides the FHS environment needed by the Steam binary.
		const controller = new AbortController();
		const factorioPromise = runFactorio(
			settings,
			['--load-game', dstSave, '--mod-directory', dstMods, '--disable-audio'],
			controller.signal
		);

		// Poll for done marker
		const resultPrefix = await pollForDoneFile(doneFile, factorioPromise);

		// Signal Factorio to stop
		controller.abort();

		// Wait for Factorio to exit (ignore errors since we aborted)
		await factorioPromise.catch(() => {});

		tryUnlink(doneFile);

		return resultPrefix;
	} finally {
		// Clean up work directory
		fs.rmSync(tmpdir, { recursive: true, force: true });
	}
}

async function pollForDoneFile(doneFile: string, factorioPromise: Promise<void>): Promise<string> {
	return new Promise((resolve, reject) => {
		let factorioDone = false;

		factorioPromise
			.then(() => {
				factorioDone = true;
			})
			.catch((err) => {
				factorioDone = true;
				// Check if done file exists before rejecting
				try {
					const content = fs.readFileSync(doneFile, 'utf-8');
					resolve(content.trim());
				} catch {
					reject(new Error(`Factorio exited early: ${err.message}`));
				}
			});

		const check = () => {
			try {
				fs.statSync(doneFile);
				const content = fs.readFileSync(doneFile, 'utf-8');
				resolve(content.trim());
				return;
			} catch {
				// Not yet
			}

			if (factorioDone) {
				// One last check
				try {
					const content = fs.readFileSync(doneFile, 'utf-8');
					resolve(content.trim());
				} catch {
					reject(new Error('Factorio exited without creating done marker'));
				}
				return;
			}

			setTimeout(check, 1000);
		};

		setTimeout(check, 1000);
	});
}
