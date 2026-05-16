import * as XLSX from 'xlsx';

import { assetTypes } from '../domain/assetTypes';
import { downloadTextFile } from '../storage/fileAccess';

export const ASSET_IMPORT_TEMPLATE_FILENAME = 'ops-assets-template.xlsx';

const TEMPLATE_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const templateHeaders = ['名称', '类型', 'IP地址', '区域', '标签', '厂商', '描述'];

const templateRows = [
  {
    名称: 'app-01',
    类型: '应用服务器',
    IP地址: '10.0.1.10',
    区域: 'app-prod',
    标签: 'api,linux',
    厂商: 'Dell',
    描述: 'API 服务节点',
  },
  {
    名称: 'redis-01',
    类型: 'Redis服务器',
    IP地址: '10.0.2.20',
    区域: 'middleware',
    标签: 'cache,prod',
    厂商: 'Huawei',
    描述: '缓存服务节点',
  },
];

export function downloadAssetImportTemplate(): void {
  const workbook = XLSX.utils.book_new();
  const templateSheet = XLSX.utils.json_to_sheet(templateRows, { header: templateHeaders });
  const typeOptionsSheet = XLSX.utils.json_to_sheet(
    assetTypes.map((assetType) => ({ 类型: assetType.label })),
  );

  templateSheet['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 28 },
  ];

  XLSX.utils.book_append_sheet(workbook, templateSheet, '资产导入模板');
  XLSX.utils.book_append_sheet(workbook, typeOptionsSheet, '类型选项');

  downloadTextFile(
    ASSET_IMPORT_TEMPLATE_FILENAME,
    XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }),
    TEMPLATE_MIME_TYPE,
  );
}
