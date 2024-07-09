export interface UserData {
    uuid: string | null;
    username: string;
}

export interface launcherInfo{
    instances: string;
    cache: string;
}

export interface launchInfo{
    ram: number;
    hide: boolean;
}

export interface instancesInfo{
    name: string;
    directory: string;
    timePlayed: Date | null;
}

export interface SessionConfig {
    isDiscordAvailable: boolean,
    isOnlineSession: boolean,
    launcherInfo: launcherInfo | null;
    launchInfo: launchInfo | null;
    instancesInfo: instancesInfo[];
}