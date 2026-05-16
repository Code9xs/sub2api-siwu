export type AutosaveStatus = 'saved' | 'dirty' | 'saving' | 'error';

interface SerializedAutosaveOptions<TProject> {
  getStatus: () => AutosaveStatus;
  save: (project: TProject) => Promise<void>;
  setStatus: (status: AutosaveStatus) => void;
}

export function createSerializedAutosave<TProject>({
  getStatus,
  save,
  setStatus,
}: SerializedAutosaveOptions<TProject>) {
  let latestProject: TProject | undefined;
  let inFlight = false;
  let drainPromise: Promise<void> | undefined;

  async function drain() {
    if (inFlight) {
      return drainPromise;
    }

    inFlight = true;
    drainPromise = runDrain();

    try {
      await drainPromise;
    } finally {
      inFlight = false;
      drainPromise = undefined;
    }
  }

  async function runDrain() {
    while (latestProject !== undefined) {
      const projectToSave = latestProject;
      latestProject = undefined;
      const statusBeforeSave = getStatus();

      if (statusBeforeSave === 'dirty' || statusBeforeSave === 'saving') {
        setStatus('saving');
      }

      try {
        await save(projectToSave);

        if (getStatus() === 'saving') {
          setStatus('saved');
        }
      } catch {
        setStatus('error');
      }
    }
  }

  return {
    schedule(project: TProject) {
      latestProject = project;
      void drain();
    },
    flush() {
      return drainPromise ?? Promise.resolve();
    },
  };
}
