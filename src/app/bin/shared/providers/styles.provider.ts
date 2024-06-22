export class FileManager {
    private CURRENT_FILES_DOWNLOAD: any[] = [];

    private modifyOpacity(op: number): number {
        switch (op) {
            case 1:
                return 0.75;
            case 0.75:
                return 0.5;
            case 0.5:
                return 0.25;
            case 0.25:
                return 0;
            default:
                return 1;
        }
    }

    private updateOpacities(): void {
        this.CURRENT_FILES_DOWNLOAD = this.CURRENT_FILES_DOWNLOAD.map(file => ({
            ...file,
            op: this.modifyOpacity(file.op)
        }));
    }

    public createListFiles(fileName: string): void {
        this.updateOpacities();

        const newFile = { name: fileName, op: 1 };

        this.CURRENT_FILES_DOWNLOAD.unshift(newFile);

        if (this.CURRENT_FILES_DOWNLOAD.length > 5) {
            this.CURRENT_FILES_DOWNLOAD.pop();
        }
    }

    public getCurrentFiles(): any[] {
        return this.CURRENT_FILES_DOWNLOAD;
    }
}
