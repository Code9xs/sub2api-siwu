import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseImportFile } from '../import/importParser';
import { useWorkspaceStore } from '../store/workspaceStore';
import { TopBar } from './TopBar';
import { ImportDialog } from './ImportDialog';

vi.mock('../import/importParser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../import/importParser')>();

  return {
    ...actual,
    parseImportFile: vi.fn(actual.parseImportFile),
  };
});

const parseImportFileMock = vi.mocked(parseImportFile);

describe('ImportDialog', () => {
  beforeEach(() => {
    parseImportFileMock.mockRestore();
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

  it('does not import or dirty the project when every row is invalid', async () => {
    const user = userEvent.setup();
    const file = new File(['type,ip\nswitch,10.0.0.1'], 'assets.csv', {
      type: 'text/csv',
    });

    render(<ImportDialog open onClose={() => undefined} />);

    await user.upload(screen.getByLabelText('\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'), file);

    const confirmButton = screen.getByRole('button', { name: '\u786e\u8ba4\u5bfc\u5165' });
    expect(confirmButton).toBeDisabled();
    expect(screen.getByText('\u6ca1\u6709\u53ef\u5bfc\u5165\u7684\u6709\u6548\u8d44\u4ea7')).toBeInTheDocument();
    await user.click(confirmButton);

    expect(useWorkspaceStore.getState().project.assets).toHaveLength(0);
    expect(useWorkspaceStore.getState().saveStatus).toBe('saved');
  });

  it('clears stale preview when closed and reopened', async () => {
    const user = userEvent.setup();
    const file = new File(['name,type,ip\ncore-sw,switch,10.0.0.1'], 'assets.csv', {
      type: 'text/csv',
    });

    render(<DialogHarness />);

    await user.click(screen.getByRole('button', { name: '\u6253\u5f00\u5bfc\u5165' }));
    await user.upload(screen.getByLabelText('\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'), file);
    expect(screen.getByLabelText('\u5bfc\u5165\u9884\u89c8')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '\u53d6\u6d88' }));
    await user.click(screen.getByRole('button', { name: '\u6253\u5f00\u5bfc\u5165' }));

    expect(screen.queryByLabelText('\u5bfc\u5165\u9884\u89c8')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u786e\u8ba4\u5bfc\u5165' })).toBeDisabled();
    expect(useWorkspaceStore.getState().project.assets).toHaveLength(0);
  });

  it('ignores parse completion after the dialog closes', async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<Awaited<ReturnType<typeof parseImportFile>>>();
    parseImportFileMock.mockReturnValueOnce(deferred.promise);

    render(<DialogHarness />);

    await user.click(screen.getByRole('button', { name: '\u6253\u5f00\u5bfc\u5165' }));
    await user.upload(
      screen.getByLabelText('\u9009\u62e9 CSV \u6216 XLSX \u6587\u4ef6'),
      new File(['name\nlate-asset'], 'assets.csv', { type: 'text/csv' }),
    );
    await user.click(screen.getByRole('button', { name: '\u53d6\u6d88' }));

    deferred.resolve([{ name: 'late-asset' }]);
    await user.click(screen.getByRole('button', { name: '\u6253\u5f00\u5bfc\u5165' }));

    expect(screen.queryByLabelText('\u5bfc\u5165\u9884\u89c8')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '\u786e\u8ba4\u5bfc\u5165' })).toBeDisabled();
  });

  it('closes on Escape and returns focus to the TopBar import button', async () => {
    const user = userEvent.setup();

    render(<TopBar />);

    const importButton = screen.getByRole('button', { name: /\u5bfc\u5165/ });
    await user.click(importButton);
    expect(screen.getByRole('dialog', { name: '\u5bfc\u5165\u8d44\u4ea7' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog', { name: '\u5bfc\u5165\u8d44\u4ea7' })).not.toBeInTheDocument();
    expect(importButton).toHaveFocus();
  });
});

function DialogHarness() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        {'\u6253\u5f00\u5bfc\u5165'}
      </button>
      <ImportDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });

  return { promise, reject, resolve };
}
