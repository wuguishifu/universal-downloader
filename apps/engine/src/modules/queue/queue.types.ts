export type DownloadStatus = 'queued' | 'in-progress' | 'completed' | 'failed';

export interface DownloadJob {
  id: string;
  url: string;
  status: DownloadStatus;
  destinationPath: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
