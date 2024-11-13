
import dynamic from 'next/dynamic';

const ProposalTable = dynamic(() => import('./ProposalsTable'), {
  ssr: false,
});

export default ProposalTable;