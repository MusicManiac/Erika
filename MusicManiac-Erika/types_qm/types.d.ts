import { ITraderBase, ITraderAssort } from "@spt-aki/models/eft/common/tables/ITrader";

export interface IQMDatabase {
    locales_traders: IQMLocales;
    traders: IQMTraders;
    TradersAssort: IQMTraders;
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