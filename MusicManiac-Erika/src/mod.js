"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigTypes_1 = require("C:/snapshot/project/obj/models/enums/ConfigTypes");
const Traders_1 = require("C:/snapshot/project/obj/models/enums/Traders");
//trader configs
const ErikaBaseJson = __importStar(require("../db/traders/Erika_Temporal_Id/base.json"));
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
"use strict";
// DB au lieu de AKI
class Erika {
    mod;
    logger;
    constructor() {
        this.mod = "MusicManiac-Erika-Standalone";
    }
    preAkiLoad(container) {
        this.logger = container.resolve("WinstonLogger");
        this.logger.debug(`[${this.mod}] Loading... `);
        this.registerProfileImage(container);
        this.setupTraderUpdateTime(container);
        Traders_1.Traders[ErikaBaseJson._id] = ErikaBaseJson._id;
        this.logger.debug(`[${this.mod}] Loaded`);
    }
    // DB AKI
    postDBLoad(container) {
        this.logger.info("Loading...");
        //Server database variables
        const databaseServer = container.resolve("DatabaseServer");
        const databaseImporter = container.resolve("ImporterUtil");
        const postAkiModLoader = container.resolve("PostAkiModLoader");
        const configServer = container.resolve("ConfigServer");
        const ragfairConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.RAGFAIR);
        //Get the SPT database and the AQM custom database
        const database = databaseServer.getTables();
        const qmDb = databaseImporter.loadRecursive(`${postAkiModLoader.getModPath(this.mod)}db/`);
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
            ragfairConfig.traders[trader] = true;
        }
        this.logger.info(`[${this.mod}] Traders loaded`);
        for (const locale in qmDb.locales_traders) {
            for (const trader in qmDb.locales_traders[locale]) {
                const traderLocale = qmDb.locales_traders[locale][trader];
                for (const entry of Object.keys(traderLocale)) {
                    locales[locale][entry] = traderLocale[entry];
                }
            }
        }
        this.logger.info(`[${this.mod}] Locales loaded`);
        this.logger.info(`[${this.mod}] Loaded successfully`);
    }
    registerProfileImage(container) {
        // Reference the mod "res" folder
        const preAkiModLoader = container.resolve("PreAkiModLoader");
        const imageFilepath = `./${preAkiModLoader.getModPath(this.mod)}res`;
        // Register route pointing to the profile picture
        const imageRouter = container.resolve("ImageRouter");
        imageRouter.addRoute(ErikaBaseJson.avatar.replace(".png", ""), `${imageFilepath}/traders/Erika_Temporal_Id.png`);
    }
    setupTraderUpdateTime(container) {
        // Add refresh time in seconds when Config server allows to set configs
        const configServer = container.resolve("ConfigServer");
        const traderConfig = configServer.getConfig(ConfigTypes_1.ConfigTypes.TRADER);
        const ErikaRefreshConfig = { traderId: ErikaBaseJson._id, seconds: 3600 };
        traderConfig.updateTime.push(ErikaRefreshConfig);
    }
}
module.exports = { mod: new Erika() };
//# sourceMappingURL=mod.js.map