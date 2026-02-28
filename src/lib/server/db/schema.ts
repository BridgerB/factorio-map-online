import {
	pgTable,
	serial,
	text,
	integer,
	bigint,
	boolean,
	timestamp,
	jsonb,
	real,
	index,
	uniqueIndex
} from 'drizzle-orm/pg-core';

export const saves = pgTable(
	'saves',
	{
		id: serial('id').primaryKey(),
		name: text('name').notNull(),
		seed: bigint('seed', { mode: 'number' }),
		mapId: text('map_id'),
		mapExchange: text('map_exchange'),
		gameVersion: text('game_version'),
		createdAt: timestamp('created_at').defaultNow().notNull(),
		updatedAt: timestamp('updated_at').defaultNow().notNull()
	},
	(table) => [uniqueIndex('saves_name_idx').on(table.name)]
);

export const mapshots = pgTable(
	'mapshots',
	{
		id: serial('id').primaryKey(),
		saveId: integer('save_id')
			.references(() => saves.id)
			.notNull(),
		uniqueId: text('unique_id').notNull(),
		tick: bigint('tick', { mode: 'number' }).notNull(),
		ticksPlayed: bigint('ticks_played', { mode: 'number' }).notNull(),
		dataPrefix: text('data_prefix').notNull(),
		renderParams: jsonb('render_params'),
		activeMods: jsonb('active_mods'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		uniqueIndex('mapshots_unique_id_idx').on(table.uniqueId),
		index('mapshots_save_id_idx').on(table.saveId),
		index('mapshots_ticks_played_idx').on(table.ticksPlayed)
	]
);

export const surfaces = pgTable(
	'surfaces',
	{
		id: serial('id').primaryKey(),
		mapshotId: integer('mapshot_id')
			.references(() => mapshots.id)
			.notNull(),
		surfaceName: text('surface_name').notNull(),
		surfaceIdx: integer('surface_idx').notNull(),
		surfaceLocalisedName: text('surface_localised_name'),
		isPlanet: boolean('is_planet').default(false),
		isSpacePlatform: boolean('is_space_platform').default(false),
		filePrefix: text('file_prefix').notNull(),
		tileSize: integer('tile_size').notNull(),
		renderSize: integer('render_size').notNull(),
		worldMinX: real('world_min_x').notNull(),
		worldMinY: real('world_min_y').notNull(),
		worldMaxX: real('world_max_x').notNull(),
		worldMaxY: real('world_max_y').notNull(),
		zoomMin: integer('zoom_min').notNull(),
		zoomMax: integer('zoom_max').notNull(),
		stations: jsonb('stations'),
		tags: jsonb('tags'),
		players: jsonb('players')
	},
	(table) => [index('surfaces_mapshot_id_idx').on(table.mapshotId)]
);

export const renderJobs = pgTable(
	'render_jobs',
	{
		id: serial('id').primaryKey(),
		saveName: text('save_name').notNull(),
		runId: text('run_id').notNull(),
		status: text('status').notNull().default('pending'),
		params: jsonb('params'),
		mapshotId: integer('mapshot_id').references(() => mapshots.id),
		errorMessage: text('error_message'),
		startedAt: timestamp('started_at'),
		completedAt: timestamp('completed_at'),
		createdAt: timestamp('created_at').defaultNow().notNull()
	},
	(table) => [
		index('render_jobs_status_idx').on(table.status),
		uniqueIndex('render_jobs_run_id_idx').on(table.runId)
	]
);
