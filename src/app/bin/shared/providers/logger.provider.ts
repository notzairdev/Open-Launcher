export interface LoggerItem {
    date: Date;
    severity: 'info' | 'warn' | 'error';
    message: string
}

export interface Logger {
    items: LoggerItem[];
}