export type ImportAssetField = 'name' | 'ip' | 'type' | 'zone' | 'tags' | 'description' | 'vendor';

export type FieldMapping = Partial<Record<ImportAssetField, string>>;

const FIELD_ALIASES: Record<ImportAssetField, string[]> = {
  name: ['name', 'asset name', 'device name', 'hostname', 'host name', '设备名称', '名称', '主机名'],
  ip: ['ip', 'ip address', 'ip地址', '地址', '管理ip', '管理地址'],
  type: ['type', 'asset type', 'device type', '类型', '设备类型'],
  zone: ['zone', 'area', 'region', 'location', '区域', '分区', '位置'],
  tags: ['tags', 'tag', 'labels', '标签', '标记'],
  description: ['description', 'desc', 'notes', 'remark', 'remarks', '备注', '描述', '说明'],
  vendor: ['vendor', 'manufacturer', 'brand', '厂商', '供应商', '品牌'],
};

export function guessFieldMapping(headers: string[]): FieldMapping {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeHeader(header),
  }));

  return Object.entries(FIELD_ALIASES).reduce<FieldMapping>((mapping, [field, aliases]) => {
    const match = normalizedHeaders.find(({ normalized }) => aliases.includes(normalized));

    if (match) {
      mapping[field as ImportAssetField] = match.original;
    }

    return mapping;
  }, {});
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}
