import * as stream from 'stream';

export const readStream = async (
    readable: stream.Readable,
    listener?: (received: Buffer, encoding: string) => void,
): Promise<Buffer> => {
    const buffer = await new Promise<Buffer>((resolve, reject) => {
        const chunks: Array<Buffer> = [];
        let totalLength = 0;
        readable.pipe(new stream.Writable({
            write(chunk: Buffer, encoding, callback) {
                chunks.push(chunk);
                totalLength += chunk.length;
                if (listener) {
                    listener(Buffer.concat(chunks, totalLength), encoding);
                }
                callback();
            },
            final(callback) {
                resolve(Buffer.concat(chunks, totalLength));
                callback();
            },
        }))
        .once('error', reject);
    });
    return buffer;
};

