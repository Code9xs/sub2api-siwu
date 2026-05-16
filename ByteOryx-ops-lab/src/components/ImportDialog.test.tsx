import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWorkspaceStore } from '../store/workspaceStore';
import { ImportDialog } from './ImportDialog';

describe('ImportDialog', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().resetWorkspace();
  });

  it('imports valid CSV assets into the workspace store', async () => {
    const user = userEvent.setup();
    const file = new File(['name,type,ip\ncore-sw,switch,10.0.0.1'], 'assets.csv', {
      type: 'text/csv',
    });

    render(<ImportDialog open onClose={() => undefined} />);

    await user.upload(screen.getByLabelText('\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'), file);
    await user.click(screen.getByRole('button', { name: '\u786e\u8ba4\u5bfc\u5165' }));

    const assets = useWorkspaceStore.getState().project.assets;
    expect(assets).toHaveLength(1);
    expect(assets[0].name).toBe('core-sw');
  });
});
