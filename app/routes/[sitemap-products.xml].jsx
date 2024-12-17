import {loader as sharedLoader} from './sitemap.xml';

export function loader(args) {
  return sharedLoader({...args, params: {type: 'products'}});
}
