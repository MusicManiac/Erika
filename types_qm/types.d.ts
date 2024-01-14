import { ITraderBase, ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";
import { IQuest } from "@spt-aki/models/eft/common/tables/IQuest";

export interface IQMDatabase {
    BarterOnly: {
        QuestBundles: Record<string, IQMQuestBundle>;
        TradersAssort: IQMTraders;
    }
    locales_traders: IQMLocales;
    QuestBundles: Record<string, IQMQuestBundle>
    traders: IQMTraders;
    TradersAssort: IQMTraders;
}

export interface IQMQuestBundle {
    Erika_Temporal_Id?:   IQMQuestBundleTrader;
}

export interface IQMQuestBundleTrader {
    locales: Record<string, Record<string, string>>;
    quests: IQuest;
}

export interface IQMTraders {
    Erika_Temporal_Id?:           IAQMTrader;
}

export interface IAQMTrader {
    base?: ITraderBase;
    assort: ITraderAssort;
    questassort?: Record<string, Record<string, string>>;
}

export interface IQMLocales {
    ch:         IQMLocalesTraders;
    cz:         IQMLocalesTraders;
    en:         IQMLocalesTraders;
    es:         IQMLocalesTraders;
    "es-mx":    IQMLocalesTraders;
    fr:         IQMLocalesTraders;
    ge:         IQMLocalesTraders;
    hu:         IQMLocalesTraders;
    it:         IQMLocalesTraders;
    jp:         IQMLocalesTraders;
    pl:         IQMLocalesTraders;
    po:         IQMLocalesTraders;
    ru:         IQMLocalesTraders;
    sk:         IQMLocalesTraders;
    tu:         IQMLocalesTraders;
}

export interface IQMLocalesTraders {
    Erika_Temporal_Id: Record<string, string>;
}