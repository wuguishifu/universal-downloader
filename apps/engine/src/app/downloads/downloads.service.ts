import { Injectable } from '@nestjs/common';

@Injectable()
export class DownloadsService {
  private readonly downloads: string[] = [];

  addDownload(url: string): void {
    this.downloads.push(url);
  }

  listDownloads(): { id: string }[] {
    return this.downloads.map((url) => ({ id: url }));
  }
}
