import { LayoutGrid, List, Plus, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { assetTypes } from '../domain/assetTypes';
import type { DomainId } from '../domain/ids';
import { useWorkspaceStore } from '../store/workspaceStore';

export const ASSET_DRAG_MIME = 'application/vnd.opsdraw.asset-id';

type AssetLayout = 'single' | 'multi';

export function writeAssetDragPayload(dataTransfer: DataTransfer, assetId: string) {
  dataTransfer.setData(ASSET_DRAG_MIME, assetId);
}

export function readAssetDragPayload(dataTransfer: DataTransfer) {
  return dataTransfer.getData(ASSET_DRAG_MIME) || null;
}

export function hasAssetDragPayload(dataTransfer: DataTransfer) {
  return Array.from(dataTransfer.types).includes(ASSET_DRAG_MIME);
}

export function AssetPool() {
  const [query, setQuery] = useState('');
  const [layout, setLayout] = useState<AssetLayout>('single');
  const [isAdding, setIsAdding] = useState(false);
  const [draft, setDraft] = useState({
    name: '',
    type: assetTypes[0]?.label ?? '应用服务器',
    ip: '',
  });
  const assets = useWorkspaceStore((state) => state.project.assets);
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());
  const addAsset = useWorkspaceStore((state) => state.addAsset);
  const deleteAsset = useWorkspaceStore((state) => state.deleteAsset);

  const placedAssetIds = useMemo(
    () => new Set(activeDiagram.nodes.map((node) => node.assetId).filter(Boolean)),
    [activeDiagram.nodes],
  );
  const visibleAssets = assets.filter((asset) => !placedAssetIds.has(asset.id));
  const normalizedQuery = query.trim().toLowerCase();
  const filteredAssets = visibleAssets.filter((asset) => {
    if (!normalizedQuery) {
      return true;
    }

    return [
      asset.name,
      asset.type,
      asset.ip ?? '',
      asset.vendor ?? '',
      asset.zone ?? '',
      asset.description ?? '',
      asset.tags.join(','),
    ].some((value) => value.toLowerCase().includes(normalizedQuery));
  });

  function submitAsset(event: React.FormEvent) {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    addAsset({
      name: draft.name.trim(),
      type: draft.type,
      ip: draft.ip.trim(),
      zone: '',
      tags: [],
      vendor: '',
      description: '',
    });
    setDraft({ name: '', type: assetTypes[0]?.label ?? '应用服务器', ip: '' });
    setIsAdding(false);
  }

  return (
    <aside className="asset-pool" role="region" aria-label="资产池">
      <div className="panel-header">
        <h2>资产池</h2>
        <span>{visibleAssets.length}</span>
      </div>
      <div className="asset-pool__controls">
        <button
          type="button"
          className="command-button"
          onClick={() => setIsAdding((current) => !current)}
        >
          <Plus size={16} aria-hidden="true" />
          添加资产
        </button>
        <div className="asset-pool__layout" aria-label="资产排列方式">
          <button
            type="button"
            className={`icon-button${layout === 'single' ? ' icon-button--active' : ''}`}
            aria-label="单行排列"
            onClick={() => setLayout('single')}
          >
            <List size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`icon-button${layout === 'multi' ? ' icon-button--active' : ''}`}
            aria-label="多行排列"
            onClick={() => setLayout('multi')}
          >
            <LayoutGrid size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      {isAdding ? (
        <form className="asset-form" onSubmit={submitAsset}>
          <label>
            <span>资产名称</span>
            <input
              aria-label="资产名称"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            <span>资产类型</span>
            <select
              aria-label="资产类型"
              value={draft.type}
              onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}
            >
              {assetTypes.map((assetType) => (
                <option key={assetType.id} value={assetType.label}>
                  {assetType.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>资产 IP</span>
            <input
              aria-label="资产 IP"
              value={draft.ip}
              onChange={(event) => setDraft((current) => ({ ...current, ip: event.target.value }))}
            />
          </label>
          <button type="submit" className="command-button command-button--primary">
            保存资产
          </button>
        </form>
      ) : null}
      <label className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索资产"
          aria-label="搜索资产"
        />
      </label>
      <div
        className={`asset-list asset-list--${layout}`}
        role="list"
        aria-label="资产列表"
      >
        {filteredAssets.length === 0 ? (
          <p className="empty-state">{visibleAssets.length === 0 ? '暂无资产' : '没有匹配资产'}</p>
        ) : (
          filteredAssets.map((asset) => (
            <article
              key={asset.id}
              className="asset-card"
              draggable
              role="listitem"
              onDragStart={(event) => writeAssetDragPayload(event.dataTransfer, asset.id)}
            >
              <div>
                <h3>{asset.name}</h3>
                <p>{asset.type}</p>
              </div>
              <div className="asset-card__meta">
                <span>{asset.ip ?? '无 IP'}</span>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`删除资产 ${asset.name}`}
                  onClick={() => deleteAsset(asset.id as DomainId<'asset'>)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
