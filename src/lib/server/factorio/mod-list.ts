import fs from 'node:fs';

export interface ModListEntry {
	name: string;
	enabled: boolean;
}

export interface ModList {
	mods: ModListEntry[];
}

export function loadModList(filename: string): ModList {
	const raw = fs.readFileSync(filename, 'utf-8');
	return JSON.parse(raw) as ModList;
}

export function writeModList(mlist: ModList, filename: string): void {
	fs.writeFileSync(filename, JSON.stringify(mlist), 'utf-8');
}

export function enableMod(modsPath: string, modName: string): void {
	const modListFile = `${modsPath}/mod-list.json`;
	const mlist = loadModList(modListFile);
	const existing = mlist.mods.find((m) => m.name === modName);
	if (existing) {
		existing.enabled = true;
	} else {
		mlist.mods.push({ name: modName, enabled: true });
	}
	writeModList(mlist, modListFile);
}
