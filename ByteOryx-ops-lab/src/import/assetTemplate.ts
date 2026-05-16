import { downloadTextFile } from '../storage/fileAccess';

export const ASSET_IMPORT_TEMPLATE_FILENAME = 'ops-assets-template.csv';

const ASSET_IMPORT_TEMPLATE_CSV = [
  'name,type,ip,zone,tags,vendor,description',
  'core-sw-01,switch,10.0.0.1,dc-a,"core,network",Cisco,核心交换机',
  'api-server-01,server,10.0.1.10,app-prod,"api,linux",Dell,API 服务节点',
].join('\n');

export function downloadAssetImportTemplate(): void {
  downloadTextFile(
    ASSET_IMPORT_TEMPLATE_FILENAME,
    ASSET_IMPORT_TEMPLATE_CSV,
    'text/csv;charset=utf-8',
  );
}
