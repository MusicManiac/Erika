//Special thanks to Ereshkigal for some code blocks used to make this possible.
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
import { HashUtil } from "@spt-aki/utils/HashUtil"
import { ImporterUtil } from "@spt-aki/utils/ImporterUtil";
import { Traders } from "@spt-aki/models/enums/Traders";
import { ItemHelper } from "@spt-aki/helpers/ItemHelper";
import { BaseClasses } from  "@spt-aki/models/enums/BaseClasses";

import { IQMDatabase }                 from "../types_qm/types"


//trader configs
import * as ErikaBaseJson from "../db/traders/Erika_Temporal_Id/base.json"

import * as config from "../src/config.json"

// eslint-disable-next-line @typescript-eslint/no-unused-expressions
"use strict";

// DB au lieu de AKI
class Erika implements IPreAkiLoadMod, IPostDBLoadMod
{
    private mod:    string;
    private logger: ILogger;

    private enabledTraders: object;

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
    public postDBLoad(container: DependencyContainer) 
    {
        this.logger.debug(`[${this.mod}] Delayed Loading... `);
        this.logger.info("Loading...");

        //Server database variables
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer")
        const databaseImporter = container.resolve<ImporterUtil>("ImporterUtil");
        const itemHelper = container.resolve<ItemHelper>("ItemHelper");
        const postAkiModLoader = container.resolve<PostAkiModLoader>("PostAkiModLoader")
        const configServer = container.resolve<ConfigServer>("ConfigServer")
        const ragfairConfig = configServer.getConfig<IRagfairConfig>(ConfigTypes.RAGFAIR);

        //Get the SPT database and the AQM custom database
        const database = databaseServer.getTables();
        const itemDB = database.templates.items;
        const qmDb: IQMDatabase = databaseImporter.loadRecursive(`${postAkiModLoader.getModPath(this.mod)}db/`);
        const locales = database.locales.global; 

        const weaponCategories = [
            "pistols762x25", "SMGs762x25",
            "pistols9x18", "SMGs9x18",
            "pistols9x19", "revolvers9x19", "SMGs9x19",
            "pistols9x21", "SMGs9x21",
            "revolvers357",
            "pistols45", "SMGs45",
            "SMGs46x30",
            "pistols57x28", "SMGs57x28",
            "assaultRifles545x39", "assaultCarbines545x39", "LMGs545x39",
            "assaultRifles556x45", "assaultCarbines556x45",
            "assaultRifles68x51",
            "assaultRifles300",
            "assaultRifles762x39", "assaultCarbines762x39", "LMGs762x39",
            "assaultRifles762x51", "assaultCarbines762x51", "DMRs762x51", "sniperRifles762x51",
            "assaultCarbines762x54", "LMGs762x54", "shotguns762x54", "DMRs762x54", "sniperRifles762x54",
            "DMRs338", "sniperRifles338",
            "assaultCarbines9x39", "assaultRifles9x39", "DMRs9x39",
            "assaultCarbines366", "assaultRifles366", "sniperRifles366",
            "revolvers127x55", "assaultRifles127x55",
            "shotguns12x70", "revolvers12x70",
            "shotguns20x70",
            "shotguns23x73",

            "SMGs", "pistols", "revolvers", "assaultRifles", "assaultCarbines", "LMGs", "shotguns", "DMRs", "sniperRifles"
        ];
        
        let weaponArrays: Record<string, string[]> = {};
        
        weaponCategories.forEach(category => {
            weaponArrays[category] = [];
        });
        

        for (let item in itemDB) {
            // if (itemDB[item]._type != "Node" && itemHelper.isOfBaseclass(itemDB[item]._parent, BaseClasses.WEAPON)) {
            if (itemDB[item]._type != "Node" && itemDB[item]._props.hasOwnProperty("ammoCaliber")) {
                const caliber = itemDB[item]._props.ammoCaliber;
                const itemId = itemDB[item]._id;
                if (caliber == "Caliber30x29" || caliber == "Caliber40x46" || itemId == "5ae083b25acfc4001a5fc702") {
                    this.logger.info(`[${this.mod}] skipping item ${itemId} (its not important to this mod)`);
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.PISTOL)) {
                    weaponArrays.pistols.push(itemId);
                    if (caliber == "Caliber762x25TT") {
                        weaponArrays.pistols762x25.push(itemId);
                    } else if (caliber == "Caliber9x18PM") {
                        weaponArrays.pistols9x18.push(itemId);
                    } else if (caliber == "Caliber9x19PARA") {
                        weaponArrays.pistols9x19.push(itemId);
                    } else if (caliber == "Caliber9x21") {
                        weaponArrays.pistols9x21.push(itemId);
                    } else if (caliber == "Caliber1143x23ACP") {
                        weaponArrays.pistols45.push(itemId);
                    } else if (caliber == "Caliber57x28") {
                        weaponArrays.pistols57x28.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] pistol ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.SMG)) {
                    weaponArrays.SMGs.push(itemId);
                    if (caliber == "Caliber762x25TT") {
                        weaponArrays.SMGs762x25.push(itemId);
                    } else if (caliber == "Caliber9x18PM" || caliber == "Caliber9x18PMM") {
                        weaponArrays.SMGs9x18.push(itemId);
                    } else if (caliber == "Caliber9x19PARA") {
                        weaponArrays.SMGs9x19.push(itemId);
                    } else if (caliber == "Caliber9x21") {
                        weaponArrays.SMGs9x21.push(itemId);
                    } else if (caliber == "Caliber1143x23ACP") {
                        weaponArrays.SMGs45.push(itemId);
                    } else if (caliber == "Caliber57x28") {
                        weaponArrays.SMGs57x28.push(itemId);
                    } else if (caliber == "Caliber46x30") {
                        weaponArrays.SMGs46x30.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] SMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.REVOLVER)) {
                    weaponArrays.revolvers.push(itemId);
                    if (caliber == "Caliber9x19PARA") {
                        weaponArrays.revolvers9x19.push(itemId);
                    } else if (caliber == "Caliber127x55") {
                        weaponArrays.revolvers127x55.push(itemId);
                    } else if (caliber == "Caliber9x33R") {
                        weaponArrays.revolvers357.push(itemId);
                    } else if (caliber == "Caliber12g") {
                        weaponArrays.revolvers12x70.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] revolver ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.ASSAULT_CARBINE)) {
                    weaponArrays.assaultCarbines.push(itemId);
                    if (caliber == "Caliber545x39") {
                        weaponArrays.assaultCarbines545x39.push(itemId);
                    } else if (caliber == "Caliber556x45NATO") {
                        weaponArrays.assaultCarbines556x45.push(itemId);
                    } else if (caliber == "Caliber762x39") {
                        weaponArrays.assaultCarbines762x39.push(itemId);
                    } else if (caliber == "Caliber762x51") {
                        weaponArrays.assaultCarbines762x51.push(itemId);
                    } else if (caliber == "Caliber762x54R") {
                        weaponArrays.assaultCarbines762x54.push(itemId);
                    } else if (caliber == "Caliber9x39") {
                        weaponArrays.assaultCarbines9x39.push(itemId);
                    } else if (caliber == "Caliber366TKM") {
                        weaponArrays.assaultCarbines366.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] assault carbine ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.ASSAULT_RIFLE)) {
                    weaponArrays.assaultRifles.push(itemId);
                    if (caliber == "Caliber545x39") {
                        weaponArrays.assaultRifles545x39.push(itemId);
                    } else if (caliber == "Caliber556x45NATO") {
                        weaponArrays.assaultRifles556x45.push(itemId);
                    } else if (caliber == "Caliber762x35") {
                        weaponArrays.assaultRifles300.push(itemId);
                    } else if (caliber == "Caliber762x39") {
                        weaponArrays.assaultRifles762x39.push(itemId);
                    } else if (caliber == "Caliber762x51") {
                        weaponArrays.assaultRifles762x51.push(itemId);
                    } else if (caliber == "Caliber9x39") {
                        weaponArrays.assaultRifles9x39.push(itemId);
                    } else if (caliber == "Caliber127x55") {
                        weaponArrays.assaultRifles127x55.push(itemId);
                    } else if (caliber == "Caliber366TKM") {
                        weaponArrays.assaultRifles366.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] assault rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.MACHINE_GUN)) {
                    weaponArrays.LMGs.push(itemId);
                    if (caliber == "Caliber545x39") {
                        weaponArrays.LMGs545x39.push(itemId);
                    } else if (caliber == "Caliber762x39") {
                        weaponArrays.LMGs762x39.push(itemId);
                    } else if (caliber == "Caliber762x54R") {
                        weaponArrays.LMGs762x54.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] LMG ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.MARKSMAN_RIFLE)) {
                    weaponArrays.DMRs.push(itemId);
                    if (caliber == "Caliber86x70") {
                        weaponArrays.DMRs338.push(itemId);
                    } else if (caliber == "Caliber762x51") {
                        weaponArrays.DMRs762x51.push(itemId);
                    } else if (caliber == "Caliber762x54R") {
                        weaponArrays.DMRs762x54.push(itemId);
                    } else if (caliber == "Caliber9x39") {
                        weaponArrays.DMRs9x39.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] DMR ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.SNIPER_RIFLE)) {
                    weaponArrays.sniperRifles.push(itemId);
                    if (caliber == "Caliber86x70") {
                        weaponArrays.sniperRifles338.push(itemId);
                    } else if (caliber == "Caliber762x51") {
                        weaponArrays.sniperRifles762x51.push(itemId);
                    } else if (caliber == "Caliber762x54R") {
                        weaponArrays.sniperRifles762x54.push(itemId);
                    } else if (caliber == "Caliber366TKM") {
                        weaponArrays.sniperRifles366.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                } else if (itemHelper.isOfBaseclass(itemId, BaseClasses.SHOTGUN)) {
                    weaponArrays.shotguns.push(itemId);
                    if (caliber == "Caliber12g") {
                        weaponArrays.shotguns12x70.push(itemId);
                    } else if (caliber == "Caliber20g") {
                        weaponArrays.shotguns20x70.push(itemId);
                    } else if (caliber == "Caliber23x75") {
                        weaponArrays.shotguns23x73.push(itemId);
                    } else if (caliber == "Caliber762x54R") {
                        weaponArrays.shotguns762x54.push(itemId);
                    } else {
                        this.logger.error(`[${this.mod}] sniper rifle ${itemId} doesn't have a matching caliber in weaponCategories`);
                    }
                }
            }
        }

        const weaponPartsAndModsCategories = [
            "scopes30mm"
        ];
        
        let weaponPartsAndMods: Record<string, string[]> = {};
        
        weaponPartsAndModsCategories.forEach(category => {
            weaponPartsAndMods[category] = [];
        });

        weaponPartsAndMods.scopes30mm = itemDB["5bfebc5e0db834001a6694e5"]._props.Slots[0]._props.filters[0].Filter;

        for (const category in weaponPartsAndMods) {
            if (weaponPartsAndMods.hasOwnProperty(category)) {
                const items = weaponPartsAndMods[category];
                this.logger.info(`${category}: ${JSON.stringify(items)}`);
            }
        }

        if (config.debug.show_All_Categories_And_Weapons_In_Them) {
            for (const category in weaponArrays) {
                if (weaponArrays.hasOwnProperty(category)) {
                    const items = weaponArrays[category];
                    this.logger.info(`${category}: ${JSON.stringify(items)}`);
                }
            }
        }
        
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

        //Add all quests to database
        for (const bundle in qmDb.QuestBundles) {
            this.logger.info(`[${this.mod}] Adding Quest Bundle: ` + bundle);
            for (const trader in qmDb.QuestBundles[bundle]) {
                //quests.json file reference
                const questsFile = qmDb.QuestBundles[bundle][trader].quests;

                for (const quest of Object.keys(questsFile)) {
                    const questContent = questsFile[quest]
                    //process quest condition configuration options
                    for (const nextCondition of questContent.conditions.AvailableForFinish) {
                        const nextConditionData = nextCondition;
                        if (nextConditionData._parent == "CounterCreator") {
                            nextConditionData._props.counter.id = nextConditionData._props.id + " counterId"
                            if (config.debug.show_Quest_Ids_Set_By_Code) {
                                this.logger.info(`[${this.mod}] Setting \`${questContent._id}\' subCondition \`${nextConditionData._props.id}\` counter id to \`${nextConditionData._props.counter.id}\``);
                            }
                        }
                        if (nextConditionData._props.type == "Elimination") {
                            let counterElimination = 0;
                            for (const subCondition of nextConditionData._props.counter.conditions) {
                                const subConditionData = subCondition;
                                if (subConditionData.id == "thisIsRandomizedInCode") {
                                    subConditionData.id = Math.random().toString(36).substring(2, 20);
                                    if (config.debug.show_Quest_Ids_Set_By_Code) {
                                        this.logger.info(`[${this.mod}] Setting \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} id to \`${subConditionData.id}\``);
                                    }
                                }
                                // replace weapons
                                if (subConditionData._parent == "Kills") {
                                    if (Array.isArray(subConditionData._props.weapon)) {
                                        // Replace each weapon ID in the array with the corresponding array from weaponArrays
                                        subConditionData._props.weapon = subConditionData._props.weapon.reduce((acc, weaponId) => {
                                            // Check if the weaponId is a key in weaponArrays
                                            if (weaponArrays.hasOwnProperty(weaponId)) {
                                                // Concatenate the corresponding array from weaponArrays
                                                if (config.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                                                    this.logger.info(`[${this.mod}] replacing \`${weaponId}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                                                }
                                                return acc.concat(weaponArrays[weaponId]);
                                            } else {
                                                // If not found, concatenate the original weaponId
                                                return acc.concat(weaponId);
                                            }
                                        }, []);
                                        if (config.debug.show_Weapons_Used_By_Each_Condition) {
                                            this.logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` weapons: ${JSON.stringify(subConditionData._props.weapon)}`);
                                        }
                                    }
                                    if (Array.isArray(subConditionData._props.weaponModsInclusive)) {
                                        subConditionData._props.weaponModsInclusive = subConditionData._props.weaponModsInclusive.reduce((acc, weaponMods) => {
                                            // Check if the weaponMods is a key in weaponModsInclusive
                                            if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                                                const modsArray = weaponPartsAndMods[weaponMods];
                                                // Concatenate each ID into a separate array
                                                const separatedArrays = modsArray.map(modId => [modId]);
                                                if (config.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                                                    this.logger.info(`[${this.mod}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` counter condition #${counterElimination} with array`);
                                                }
                                                // Concatenate the arrays into the accumulator
                                                return acc.concat(separatedArrays);
                                            } else {
                                                // If not found, concatenate the original weaponId
                                                return acc.concat([weaponMods]);
                                            }
                                        }, []);
                                        if (config.debug.show_Weapon_Mods_Used_By_Each_Condition) {
                                            this.logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` weapon mods: ${JSON.stringify(subConditionData._props.weaponModsInclusive)}`);
                                        }
                                    }
                                }
                                counterElimination++;
                            }
                            if (config.questsKillsCounterMultipliers.hasOwnProperty(questContent._id)) {
                                const multiplier = config.questsKillsCounterMultipliers[questContent._id];
                                nextConditionData._props.value *= multiplier;
                                nextConditionData._props.value = Math.ceil(nextConditionData._props.value);
                            }
                        }
                        if (nextConditionData._parent == "HandoverItem") {
                            if (config.questsItemCounterMultipliers.hasOwnProperty(questContent._id)) {
                                const multiplier = config.questsItemCounterMultipliers[questContent._id];
                                nextConditionData._props.value *= multiplier;
                                nextConditionData._props.value = Math.ceil(nextConditionData._props.value);
                            }
                            if (Array.isArray(nextConditionData._props.target)) {
                                nextConditionData._props.target = nextConditionData._props.target.reduce((acc, weaponMods) => {
                                    // Check if the weaponMods is a key in weaponPartsAndMods
                                    if (weaponPartsAndMods.hasOwnProperty(weaponMods)) {
                                        // Concatenate the corresponding array from weaponArrays
                                        if (config.debug.show_Weapons_And_Parts_Being_Replaced_In_Quests) {
                                            this.logger.info(`[${this.mod}] replacing \`${weaponMods}\` in quest \`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` with array`);
                                        }
                                    return acc.concat(weaponPartsAndMods[weaponMods]);
                                    } else {
                                        // If not found, concatenate the original weaponMods
                                        return acc.concat(weaponMods);
                                    }
                                }, []);
                                if (config.debug.show_Weapon_Mods_Used_By_Each_Condition) {
                                    this.logger.info(`\`${questContent._id}\` subCondition \`${nextConditionData._props.id}\` weapon mods: ${JSON.stringify(nextConditionData._props.target)}`);
                                }
                            }
                        }
                    }

                    for (const nextCondition of questContent.conditions.AvailableForStart) {
                        const nextConditionData = nextCondition;
                        if (nextConditionData._parent == "Level") {
                            nextConditionData._props.id = questContent._id + " startingLevel check Id"
                            if (config.debug.show_Quest_Ids_Set_By_Code) {
                                this.logger.info(`[${this.mod}] Setting \`${questContent._id}\' starting level condition id to \`${nextConditionData._props.id}\``);
                            }
                            if (config.questsLevelRequirements.hasOwnProperty(questContent._id)) {
                                nextConditionData._props.value = config.questsLevelRequirements[questContent._id];
                            }
                        } else if (nextConditionData._parent == "Quest") {
                            nextConditionData._props.id = questContent._id + " quest completion check id"
                            if (config.debug.show_Quest_Ids_Set_By_Code) {
                                this.logger.info(`[${this.mod}] Setting \`${questContent._id}\' quest completion check id to \`${nextConditionData._props.id}\``);
                            }
                        }
                    }

                    //Override starting requirements if configured
                    if (config.AllQuestsAvailableFromStart) 
                    {
                        questContent.conditions.AvailableForStart = [{
                            "_parent": "Level",
                            "_props": {
                                "compareMethod": ">=",
                                "value": "1",
                                "index": 0,
                                "parentId": "",
                                "id": "QM-AllQuestsAvailable-LevelCondition"
                            }
                        }]
                    }

                    //Special thanks to @November75  for this fix
                    //this.fixRewardsSuccessItemID(questContent, hashUtil);

                    //Insert quest into database
                    database.templates.quests[questContent._id] = questContent;
                }
            }
        }

        this.logger.info(`[${this.mod}] Quests loaded`)

        //Add all locales to SPT database
        for (const bundle in qmDb.QuestBundles)  {
            for (const trader in qmDb.QuestBundles[bundle]) {
                //Skip adding the trader if they are disabled in config:
                //if (!this.enabledTraders[trader]) continue;

                for (const locale in qmDb.QuestBundles[bundle][trader].locales) {
                    //BulkFile import
                    const localeData = qmDb.QuestBundles[bundle][trader].locales[locale]
                    for (const localeDataEntry of Object.keys(localeData)) {
                        const subFileContent = localeData[localeDataEntry]
                        locales[locale][localeDataEntry] = subFileContent
                    }

                }
            }
        }

        for (const locale in qmDb.locales_traders) {
            for (const trader in qmDb.locales_traders[locale]) {

                const traderLocale = qmDb.locales_traders[locale][trader]

                for (const entry of Object.keys(traderLocale)) 
                {
                    locales[locale][entry] = traderLocale[entry]
                }
            }
        }

        this.logger.info(`[${this.mod}] Locales loaded`)

        this.logger.debug(`[${this.mod}] Delayed Loaded`)
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