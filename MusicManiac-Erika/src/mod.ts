import type { DependencyContainer } from "tsyringe"

import { IPreAkiLoadMod } from "@spt-aki/models/external/IPreAkiLoadMod";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger"
import { PreAkiModLoader } from "@spt-aki/loaders/PreAkiModLoader";
import { PostAkiModLoader } from "@spt-aki/loaders/PostAkiModLoader"
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer"
import { ImageRouter } from "@spt-aki/routers/ImageRouter"
import { ConfigServer } from "@spt-aki/servers/ConfigServer"
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes"
import { ITraderConfig, UpdateTime } from "@spt-aki/models/spt/config/ITraderConfig"
import { IRagfairConfig } from "@spt-aki/models/spt/config/IRagfairConfig"
import { ImporterUtil } from "@spt-aki/utils/ImporterUtil";
import { Traders } from "@spt-aki/models/enums/Traders";

import { IQMDatabase }                 from "../types_qm/types"


//trader configs
import * as ErikaBaseJson from "../db/traders/Erika_Temporal_Id/base.json"

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
"use strict";

// DB au lieu de AKI
class Erika implements IPreAkiLoadMod, IPostDBLoadMod
{
	private mod:    string;
	private logger: ILogger;

	constructor() 
	{
		this.mod = "MusicManiac-Erika";
	}

	public preAkiLoad(container: DependencyContainer)
	{
		this.logger = container.resolve<ILogger>("WinstonLogger");

		this.logger.debug(`[${this.mod}] Loading... `)
		this.registerProfileImage(container);
		this.setupTraderUpdateTime(container);

		Traders[ErikaBaseJson._id] = ErikaBaseJson._id;

		this.logger.debug(`[${this.mod}] Loaded`)
	}

	// DB AKI
	public postDBLoad(container: DependencyContainer) {
		this.logger.info("Loading...");

		//Server database variables
		const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
		const databaseImporter = container.resolve<ImporterUtil>("ImporterUtil");
		const postAkiModLoader = container.resolve<PostAkiModLoader>("PostAkiModLoader")
		const configServer = container.resolve<ConfigServer>("ConfigServer")
		const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);

		//Get the SPT database and the AQM custom database
		const database = databaseServer.getTables();
		const qmDb: IQMDatabase = databaseImporter.loadRecursive(`${postAkiModLoader.getModPath(this.mod)}db/`);
		const locales = database.locales.global; 

		
		//Add all traders to SPT database
		for (const trader in qmDb.traders) {
			//Skip adding the trader if they are disabled in config:
			//if (!this.enabledTraders[trader]) continue;

			//Remove trader item requirements if configured
			const questAssort = qmDb.traders[trader].questassort;

			database.traders[trader] = {
				base: qmDb.traders[trader].base,
				assort: qmDb.traders[trader].assort,
				questassort: questAssort
			};

			ragfairConfig.traders[trader] = true
		}

		this.logger.info(`[${this.mod}] Traders loaded`);

		for (const locale in qmDb.locales_traders) {
			for (const trader in qmDb.locales_traders[locale]) {
				const traderLocale = qmDb.locales_traders[locale][trader]
				for (const entry of Object.keys(traderLocale)) {
					locales[locale][entry] = traderLocale[entry]
				}
			}
		}   

		this.logger.info(`[${this.mod}] Locales loaded`)
		this.logger.info(`[${this.mod}] Loaded successfully`)
	}

	private registerProfileImage(container: DependencyContainer): void {
		// Reference the mod "res" folder
		const preAkiModLoader = container.resolve<PreAkiModLoader>("PreAkiModLoader")
		const imageFilepath = `./${preAkiModLoader.getModPath(this.mod)}res`
		// Register route pointing to the profile picture
		const imageRouter = container.resolve<ImageRouter>("ImageRouter")
		imageRouter.addRoute(ErikaBaseJson.avatar.replace(".png", ""), `${imageFilepath}/traders/Erika_Temporal_Id.png`)
	}

	private setupTraderUpdateTime(container: DependencyContainer): void {
		// Add refresh time in seconds when Config server allows to set configs
		const configServer = container.resolve<ConfigServer>("ConfigServer")
		const traderConfig = configServer.getConfig<ITraderConfig>(ConfigTypes.TRADER)
		const ErikaRefreshConfig: UpdateTime = { traderId: ErikaBaseJson._id, seconds: 3600 }
		traderConfig.updateTime.push(ErikaRefreshConfig)
	}
}

module.exports = { mod: new Erika() }