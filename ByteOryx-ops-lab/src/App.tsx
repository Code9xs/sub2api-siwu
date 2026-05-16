import { ReactFlowProvider } from '@xyflow/react';

import { Shell } from './components/Shell';

export default function App() {
  return (
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>
  );
}
