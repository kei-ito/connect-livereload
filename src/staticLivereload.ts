import * as fs from 'fs';
import * as connect from 'connect';
import * as stream from 'stream';
import {URL} from 'url';
import {handleError} from './handleError';
import {IOptions} from './types';
import {getTools} from './getTools';

export const staticLivereload = (
    options: IOptions,
): connect.NextHandleFunction => {
    const {
        console,
        findFile,
        injectSnippet,
        getContentType,
        handleConnection,
        fileWatcher,
        connectionPath,
    } = getTools(options);
    let counter = 0;
    return (req, res, next) => {
        const id = `#${counter++}`;
        console.info(id, '←', req.method, req.url);
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname.startsWith(connectionPath)) {
            handleConnection(req, res);
        } else {
            findFile(url.pathname)
            .then(async (file) => {
                console.debug(id, '→', file.path);
                const contentType = getContentType(file.path);
                if (contentType) {
                    res.setHeader('content-type', contentType);
                }
                let reader: stream.Readable = fs.createReadStream(file.path);
                if (res.getHeader('content-type') === 'text/html') {
                    res.setHeader('content-length', file.stats.size + injectSnippet.size);
                    reader = injectSnippet(reader);
                } else {
                    res.setHeader('content-length', file.stats.size);
                }
                await new Promise((resolve, reject) => {
                    res.statusCode = 200;
                    reader.pipe(res).once('error', reject).once('finish', resolve);
                });
                if (fileWatcher && !findFile.isReserved(url.pathname)) {
                    fileWatcher.add(file.path);
                }
            })
            .catch((error) => {
                handleError(id, res, error, console);
                next(error);
            })
            .then(() => console.debug(id, '→', res.statusCode, {...res.getHeaders()}));
        }
    };
};
