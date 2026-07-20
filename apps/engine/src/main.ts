import { RpcClient, RpcServer } from '@udl/protocol';
import { SocketTransportClient, SocketTransportServer } from '@udl/transport';

(async () => {
  const downloads: string[] = [];

  const server = new RpcServer(
    {
      addDownload: ({ url }) => {
        downloads.push(url);
      },
      listDownloads: () => {
        return downloads.map((d) => ({ id: d }));
      },
    },
    new SocketTransportServer(),
  );

  await server.listen();

  const client = new RpcClient(new SocketTransportClient());

  console.log(await client.call('addDownload', { url: 'test0' }));
  console.log(await client.call('addDownload', { url: 'test1' }));
  console.log(await client.call('listDownloads'));

  console.log(await client.call('addDownload', { url: 'test2' }));
  console.log(await client.call('addDownload', { url: 'test3' }));
  console.log(await client.call('listDownloads'));

  await server.close();
})()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
