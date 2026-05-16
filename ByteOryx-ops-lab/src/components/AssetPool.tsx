import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useWorkspaceStore } from '../store/workspaceStore';

export function AssetPool() {
  const [query, setQuery] = useState('');
  const assets = useWorkspaceStore((state) => state.project.assets);
  const activeDiagram = useWorkspaceStore((state) => state.activeDiagram());

  const placedAssetIds = useMemo(
    () => new Set(activeDiagram.nodes.map((node) => node.assetId).filter(Boolean)),
    [activeDiagram.nodes],
  );
  const normalizedQuery = query.trim().toLowerCase();
  const filteredAssets = assets.filter((asset) => {
    if (!normalizedQuery) {
      return true;
    }

    return [asset.name, asset.type, asset.ip ?? ''].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    );
  });

  return (
    <aside className="asset-pool" role="region" aria-label="资产池">
      <div className="panel-header">
        <h2>资产池</h2>
        <span>{assets.length}</span>
      </div>
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
      <div className="asset-list">
        {filteredAssets.length === 0 ? (
          <p className="empty-state">{assets.length === 0 ? '暂无资产' : '没有匹配资产'}</p>
        ) : (
          filteredAssets.map((asset) => (
            <article key={asset.id} className="asset-card">
              <div>
                <h3>{asset.name}</h3>
                <p>{asset.type}</p>
              </div>
              <div className="asset-card__meta">
                <span>{asset.ip ?? '无 IP'}</span>
                <strong>{placedAssetIds.has(asset.id) ? '已放置' : '未放置'}</strong>
              </div>
            </article>
          ))
        )}
      </div>
    </aside>
  );
}
