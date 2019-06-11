import * as path from 'path';
import {ensureArray} from './ensureArray';
import {IContentTypeGetter} from './types';
import {defaultContentTypes} from './defaultContentTypes';

export const compileContentTypes = (
    overrides: {
        [type: string]: string | Array<string>,
    } = {},
): IContentTypeGetter => {
    const map = new Map<string, string>();
    for (const [type, extensions] of Object.entries({...defaultContentTypes, ...overrides})) {
        for (const extension of ensureArray(extensions)) {
            map.set(extension, type);
        }
    }
    return (file: string) => map.get(path.extname(file)) || null;
};
